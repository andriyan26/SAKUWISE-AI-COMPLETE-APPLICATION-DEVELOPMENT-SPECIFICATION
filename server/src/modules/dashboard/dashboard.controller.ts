import { Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../config/db.js';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';

function getDateRange(rangeType: string, customStart?: string, customEnd?: string) {
  const now = new Date();
  let start = new Date();
  let end = new Date();
  let prevStart = new Date();
  let prevEnd = new Date();

  if (rangeType === '7_days') {
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    prevStart.setDate(start.getDate() - 7);
    prevStart.setHours(0, 0, 0, 0);
    prevEnd.setDate(start.getDate() - 1);
    prevEnd.setHours(23, 59, 59, 999);
  } else if (rangeType === 'last_month') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
  } else if (rangeType === '3_months') {
    start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    prevStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    prevEnd = new Date(now.getFullYear(), now.getMonth() - 2, 0, 23, 59, 59, 999);
  } else if (rangeType === 'custom' && customStart && customEnd) {
    start = new Date(customStart);
    end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    const duration = end.getTime() - start.getTime();
    prevEnd = new Date(start.getTime() - 1);
    prevStart = new Date(prevEnd.getTime() - duration);
  } else {
    // Default: 'this_month'
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  }

  return { start, end, prevStart, prevEnd };
}

export const getDashboardSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { range = 'this_month', startDate, endDate } = req.query as Record<string, string>;

    const { start, end, prevStart, prevEnd } = getDateRange(range, startDate, endDate);

    // 1. All-time balance (Total Saldo)
    const allTimeAgg = await prisma.transaction.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { amount: true },
    });

    let allTimeIncome = 0;
    let allTimeExpense = 0;
    allTimeAgg.forEach((agg) => {
      const val = agg._sum.amount ? Number(agg._sum.amount) : 0;
      if (agg.type === 'INCOME') allTimeIncome += val;
      if (agg.type === 'EXPENSE') allTimeExpense += val;
    });
    const currentBalance = allTimeIncome - allTimeExpense;

    // 2. Period income & expense
    const currentPeriodAgg = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        transactionDate: { gte: start, lte: end },
      },
      _sum: { amount: true },
    });

    let periodIncome = 0;
    let periodExpense = 0;
    currentPeriodAgg.forEach((agg) => {
      const val = agg._sum.amount ? Number(agg._sum.amount) : 0;
      if (agg.type === 'INCOME') periodIncome += val;
      if (agg.type === 'EXPENSE') periodExpense += val;
    });

    // 3. Previous period income & expense for trend
    const prevPeriodAgg = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        transactionDate: { gte: prevStart, lte: prevEnd },
      },
      _sum: { amount: true },
    });

    let prevIncome = 0;
    let prevExpense = 0;
    prevPeriodAgg.forEach((agg) => {
      const val = agg._sum.amount ? Number(agg._sum.amount) : 0;
      if (agg.type === 'INCOME') prevIncome += val;
      if (agg.type === 'EXPENSE') prevExpense += val;
    });

    const incomeTrend = prevIncome > 0 ? Math.round(((periodIncome - prevIncome) / prevIncome) * 100) : 0;
    const expenseTrend = prevExpense > 0 ? Math.round(((periodExpense - prevExpense) / prevExpense) * 100) : 0;

    // 4. Remaining budget for active budgets
    const activeBudgets = await prisma.budget.findMany({
      where: {
        userId,
        periodStart: { lte: end },
        periodEnd: { gte: start },
      },
    });

    let totalBudgetLimit = 0;
    let totalBudgetSpent = 0;

    for (const b of activeBudgets) {
      totalBudgetLimit += Number(b.amount);
      const spentAgg = await prisma.transaction.aggregate({
        where: {
          userId,
          type: 'EXPENSE',
          transactionDate: { gte: b.periodStart, lte: b.periodEnd },
          ...(b.categoryId ? { categoryId: b.categoryId } : {}),
        },
        _sum: { amount: true },
      });
      totalBudgetSpent += Number(spentAgg._sum.amount || 0);
    }

    const remainingBudget = Math.max(0, totalBudgetLimit - totalBudgetSpent);
    const budgetUsagePercent = totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0;

    res.json({
      success: true,
      data: {
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
          range,
        },
        cards: {
          currentBalance: {
            amount: currentBalance,
            label: 'Total Saldo',
          },
          periodIncome: {
            amount: periodIncome,
            label: 'Total Pemasukan',
            trendPercentage: incomeTrend,
            isPositive: incomeTrend >= 0,
          },
          periodExpense: {
            amount: periodExpense,
            label: 'Total Pengeluaran',
            trendPercentage: expenseTrend,
            isPositive: expenseTrend <= 0, // Lower expense is positive
          },
          remainingBudget: {
            amount: remainingBudget,
            limit: totalBudgetLimit,
            spent: totalBudgetSpent,
            usagePercent: budgetUsagePercent,
            label: 'Sisa Anggaran',
          },
        },
      },
    });
  } catch (error) {
    console.error('getDashboardSummary error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil ringkasan dashboard.' });
  }
};

export const getDashboardCashFlow = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { range = 'this_month', startDate, endDate } = req.query as Record<string, string>;
    const { start, end } = getDateRange(range, startDate, endDate);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: { gte: start, lte: end },
      },
      select: {
        amount: true,
        type: true,
        transactionDate: true,
      },
      orderBy: { transactionDate: 'asc' },
    });

    // Group by date (day)
    const pointsMap = new Map<string, { date: string; income: number; expense: number; net: number }>();

    // Pre-fill days in range
    const curr = new Date(start);
    while (curr <= end) {
      const dateKey = curr.toISOString().split('T')[0];
      const dayFormatted = curr.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      pointsMap.set(dateKey, { date: dayFormatted, income: 0, expense: 0, net: 0 });
      curr.setDate(curr.getDate() + 1);
    }

    transactions.forEach((t) => {
      const dateKey = t.transactionDate.toISOString().split('T')[0];
      const point = pointsMap.get(dateKey);
      if (point) {
        const val = Number(t.amount);
        if (t.type === 'INCOME') point.income += val;
        if (t.type === 'EXPENSE') point.expense += val;
        point.net = point.income - point.expense;
      }
    });

    const series = Array.from(pointsMap.values());

    res.json({ success: true, data: series });
  } catch (error) {
    console.error('getDashboardCashFlow error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil grafik arus kas.' });
  }
};

export const getDashboardExpenseBreakdown = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { range = 'this_month', startDate, endDate } = req.query as Record<string, string>;
    const { start, end } = getDateRange(range, startDate, endDate);

    const breakdown = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        transactionDate: { gte: start, lte: end },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const categories = await prisma.category.findMany({
      where: {
        id: { in: breakdown.map((b) => b.categoryId) },
      },
    });

    const catMap = new Map(categories.map((c) => [c.id, c]));

    const totalExpense = breakdown.reduce((acc, b) => acc + Number(b._sum.amount || 0), 0);

    const data = breakdown
      .map((b) => {
        const amount = Number(b._sum.amount || 0);
        const cat = catMap.get(b.categoryId);
        return {
          categoryId: b.categoryId,
          categoryName: cat?.name || 'Lainnya',
          icon: cat?.icon || 'MoreHorizontal',
          color: cat?.color || '#64748B',
          amount,
          transactionCount: b._count.id,
          percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    res.json({
      success: true,
      data: {
        totalExpense,
        items: data,
      },
    });
  } catch (error) {
    console.error('getDashboardExpenseBreakdown error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil distribusi pengeluaran.' });
  }
};

export const getDashboardRecentTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const recent = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { transactionDate: 'desc' },
      take: 5,
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true, type: true },
        },
      },
    });

    res.json({ success: true, data: recent });
  } catch (error) {
    console.error('getDashboardRecentTransactions error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil transaksi terbaru.' });
  }
};

export const getDashboardInsights = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get current month transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { category: true },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryExpenseMap = new Map<string, number>();

    transactions.forEach((t) => {
      const val = Number(t.amount);
      if (t.type === 'INCOME') {
        totalIncome += val;
      } else {
        totalExpense += val;
        const catName = t.category.name;
        categoryExpenseMap.set(catName, (categoryExpenseMap.get(catName) || 0) + val);
      }
    });

    const insights = [];

    // Find top category
    let topCategory = '';
    let topAmount = 0;
    categoryExpenseMap.forEach((amt, name) => {
      if (amt > topAmount) {
        topAmount = amt;
        topCategory = name;
      }
    });

    if (topCategory && totalExpense > 0) {
      const pct = Math.round((topAmount / totalExpense) * 100);
      insights.push({
        id: 'top-cat',
        type: 'WARNING',
        title: `Kategori Terbesar: ${topCategory}`,
        description: `Pengeluaran untuk ${topCategory} mencapai Rp ${topAmount.toLocaleString('id-ID')} (${pct}% dari total pengeluaran bulan ini). Pertimbangkan untuk membuat batas anggaran.`,
        actionText: 'Buat Anggaran',
        actionRoute: '/budgets',
      });
    }

    // Savings rate insight
    if (totalIncome > 0) {
      const savings = Math.max(0, totalIncome - totalExpense);
      const savingsRate = Math.round((savings / totalIncome) * 100);

      if (savingsRate >= 30) {
        insights.push({
          id: 'savings-rate-good',
          type: 'SUCCESS',
          title: `Rasio Tabungan Sehat (${savingsRate}%)`,
          description: `Bagus sekali! Kamu telah menyisihkan Rp ${savings.toLocaleString('id-ID')} (${savingsRate}%) dari total pemasukanmu bulan ini.`,
          actionText: 'Tambah Tabungan',
          actionRoute: '/goals',
        });
      } else if (savingsRate < 10) {
        insights.push({
          id: 'savings-rate-low',
          type: 'INFO',
          title: `Rasio Tabungan Terbatas (${savingsRate}%)`,
          description: `Tingkat tabunganmu saat ini ${savingsRate}%. Standar ideal adalah 20% dari penghasilan. Evaluasi kembali pos pengeluaran sekunder.`,
          actionText: 'Konsultasi AI',
          actionRoute: '/ai-assistant',
        });
      }
    }

    if (insights.length === 0) {
      insights.push({
        id: 'default-welcome',
        type: 'INFO',
        title: 'Mulai Catat Keuanganmu',
        description: 'Semakin sering kamu mencatat transaksi, semakin akurat rekomendasi cerdas dari SAKUWISE AI.',
        actionText: 'Tambah Transaksi',
        actionRoute: '/transactions',
      });
    }

    res.json({ success: true, data: insights });
  } catch (error) {
    console.error('getDashboardInsights error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil insight dashboard.' });
  }
};
