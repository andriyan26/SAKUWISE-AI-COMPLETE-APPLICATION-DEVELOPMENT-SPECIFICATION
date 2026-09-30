import { Response } from 'express';
import prisma from '../../config/db.js';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';

export const getCashFlowAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = new Date();

    // Past 6 months
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthName = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

      const txs = await prisma.transaction.groupBy({
        by: ['type'],
        where: {
          userId,
          transactionDate: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });

      let income = 0;
      let expense = 0;
      txs.forEach((t) => {
        const val = Number(t._sum.amount || 0);
        if (t.type === 'INCOME') income += val;
        if (t.type === 'EXPENSE') expense += val;
      });

      monthlyData.push({
        month: monthName,
        income,
        expense,
        net: income - expense,
      });
    }

    res.json({ success: true, data: monthlyData });
  } catch (error) {
    console.error('getCashFlowAnalytics error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil analisis arus kas.' });
  }
};

export const getExpensesAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const breakdown = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const categories = await prisma.category.findMany({
      where: { id: { in: breakdown.map((b) => b.categoryId) } },
    });
    const catMap = new Map(categories.map((c) => [c.id, c]));

    const totalExpense = breakdown.reduce((acc, b) => acc + Number(b._sum.amount || 0), 0);

    const categoryStats = breakdown.map((b) => {
      const amount = Number(b._sum.amount || 0);
      const cat = catMap.get(b.categoryId);
      return {
        categoryId: b.categoryId,
        name: cat?.name || 'Lainnya',
        icon: cat?.icon || 'Tag',
        color: cat?.color || '#64748B',
        totalAmount: amount,
        transactionCount: b._count.id,
        averagePerTransaction: b._count.id > 0 ? Math.round(amount / b._count.id) : 0,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);

    res.json({
      success: true,
      data: {
        totalExpense,
        categories: categoryStats,
      },
    });
  } catch (error) {
    console.error('getExpensesAnalytics error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil analisis pengeluaran.' });
  }
};

export const getIncomeAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const breakdown = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'INCOME',
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const categories = await prisma.category.findMany({
      where: { id: { in: breakdown.map((b) => b.categoryId) } },
    });
    const catMap = new Map(categories.map((c) => [c.id, c]));

    const totalIncome = breakdown.reduce((acc, b) => acc + Number(b._sum.amount || 0), 0);

    const sources = breakdown.map((b) => {
      const amount = Number(b._sum.amount || 0);
      const cat = catMap.get(b.categoryId);
      return {
        categoryId: b.categoryId,
        name: cat?.name || 'Pemasukan Lain',
        icon: cat?.icon || 'Briefcase',
        color: cat?.color || '#16A34A',
        totalAmount: amount,
        transactionCount: b._count.id,
        percentage: totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0,
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);

    res.json({
      success: true,
      data: {
        totalIncome,
        sources,
      },
    });
  } catch (error) {
    console.error('getIncomeAnalytics error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil analisis pemasukan.' });
  }
};

export const getFinancialHealth = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Current month income & expense
    const currentTxs = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    let income = 0;
    let expense = 0;
    currentTxs.forEach((t) => {
      const val = Number(t._sum.amount || 0);
      if (t.type === 'INCOME') income += val;
      if (t.type === 'EXPENSE') expense += val;
    });

    // Savings rate: ((Income - Expense) / Income) * 100
    const savings = Math.max(0, income - expense);
    const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

    // Expense-to-Income ratio: (Expense / Income) * 100
    const expenseToIncomeRatio = income > 0 ? Math.round((expense / income) * 100) : 100;

    // Budget Adherence
    const activeBudgets = await prisma.budget.findMany({
      where: {
        userId,
        periodStart: { lte: endOfMonth },
        periodEnd: { gte: startOfMonth },
      },
    });

    let withinBudgetCount = 0;
    for (const b of activeBudgets) {
      const spentAgg = await prisma.transaction.aggregate({
        where: {
          userId,
          type: 'EXPENSE',
          transactionDate: { gte: b.periodStart, lte: b.periodEnd },
          ...(b.categoryId ? { categoryId: b.categoryId } : {}),
        },
        _sum: { amount: true },
      });
      const spent = Number(spentAgg._sum.amount || 0);
      if (spent <= Number(b.amount)) {
        withinBudgetCount++;
      }
    }

    const budgetAdherence = activeBudgets.length > 0
      ? Math.round((withinBudgetCount / activeBudgets.length) * 100)
      : 100;

    // Goals progress
    const goals = await prisma.savingsGoal.findMany({
      where: { userId, status: 'IN_PROGRESS' },
    });

    let avgGoalProgress = 0;
    if (goals.length > 0) {
      const sumProgress = goals.reduce((acc, g) => {
        const t = Number(g.targetAmount);
        const c = Number(g.currentAmount);
        return acc + (t > 0 ? Math.min(100, (c / t) * 100) : 0);
      }, 0);
      avgGoalProgress = Math.round(sumProgress / goals.length);
    }

    // Health Score calculation (0-100 weighted index)
    // 35% savings rate (ideal 30% -> full score)
    // 35% expense-to-income (<= 70% -> full score)
    // 15% budget adherence
    // 15% goal progress
    let healthScore = 0;
    healthScore += Math.min(35, (savingsRate / 30) * 35);
    healthScore += Math.max(0, Math.min(35, ((100 - expenseToIncomeRatio) / 30) * 35));
    healthScore += (budgetAdherence / 100) * 15;
    healthScore += (avgGoalProgress / 100) * 15;
    healthScore = Math.min(100, Math.max(10, Math.round(healthScore)));

    let rating = 'Cukup Baik';
    let ratingDescription = 'Kondisi finansial stabil dengan potensi optimalisasi tabungan.';
    if (healthScore >= 80) {
      rating = 'Sangat Sehat';
      ratingDescription = 'Portofolio keuangan seimbang, rasio tabungan prima dan kepatuhan anggaran tinggi.';
    } else if (healthScore < 50) {
      rating = 'Perlu Perhatian';
      ratingDescription = 'Pengeluaran mendekati atau melampaui pemasukan. Evaluasi pos anggaran non-primer.';
    }

    res.json({
      success: true,
      data: {
        healthScore,
        rating,
        ratingDescription,
        metrics: [
          {
            key: 'savings_rate',
            label: 'Rasio Tabungan',
            value: `${savingsRate}%`,
            target: '≥ 20%',
            status: savingsRate >= 20 ? 'GOOD' : 'WARNING',
            formula: '((Pemasukan - Pengeluaran) / Pemasukan) * 100',
            description: 'Persentase penghasilan yang berhasil disisihkan untuk tabungan dan investasi.',
          },
          {
            key: 'expense_income_ratio',
            label: 'Rasio Pengeluaran terhadap Pemasukan',
            value: `${expenseToIncomeRatio}%`,
            target: '≤ 70%',
            status: expenseToIncomeRatio <= 70 ? 'GOOD' : 'WARNING',
            formula: '(Total Pengeluaran / Total Pemasukan) * 100',
            description: 'Mengukur seberapa besar porsi penghasilan yang dibelanjakan dalam satu periode.',
          },
          {
            key: 'budget_adherence',
            label: 'Kepatuhan Anggaran',
            value: `${budgetAdherence}%`,
            target: '100%',
            status: budgetAdherence >= 80 ? 'GOOD' : 'WARNING',
            formula: '(Jumlah Anggaran Terpenuhi / Total Anggaran Aktif) * 100',
            description: 'Kepatuhan belanja agar tidak melewati pagu anggaran yang telah ditentukan.',
          },
          {
            key: 'goal_progress',
            label: 'Kemajuan Target Finansial',
            value: `${avgGoalProgress}%`,
            target: '100%',
            status: 'GOOD',
            formula: 'Rata-rata persentase terkumpul dari seluruh target tabungan aktif.',
            description: 'Tingkat konsistensi penyisihan dana untuk target masa depan.',
          },
        ],
      },
    });
  } catch (error) {
    console.error('getFinancialHealth error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil kesehatan keuangan.' });
  }
};
