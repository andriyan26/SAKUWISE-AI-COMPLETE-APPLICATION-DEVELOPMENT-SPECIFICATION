import { Response } from 'express';
import prisma from '../../config/db.js';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';

export const generateReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { reportType = 'monthly_summary', startDate, endDate } = req.body;

    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: { gte: start, lte: end },
      },
      include: { category: true },
      orderBy: { transactionDate: 'desc' },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals = new Map<string, { name: string; type: string; total: number; count: number }>();

    transactions.forEach((t) => {
      const amt = Number(t.amount);
      if (t.type === 'INCOME') totalIncome += amt;
      if (t.type === 'EXPENSE') totalExpense += amt;

      const catName = t.category.name;
      const existing = categoryTotals.get(catName) || { name: catName, type: t.type, total: 0, count: 0 };
      existing.total += amt;
      existing.count += 1;
      categoryTotals.set(catName, existing);
    });

    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        periodStart: { lte: end },
        periodEnd: { gte: start },
      },
      include: { category: true },
    });

    const budgetPerformance = await Promise.all(
      budgets.map(async (b) => {
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
        const limit = Number(b.amount);
        return {
          name: b.name,
          category: b.category?.name || 'Semua',
          limit,
          spent,
          percentage: limit > 0 ? Math.round((spent / limit) * 100) : 0,
        };
      })
    );

    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
    });

    res.json({
      success: true,
      data: {
        reportType,
        period: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        },
        generatedAt: new Date().toISOString(),
        summary: {
          totalIncome,
          totalExpense,
          netCashFlow: totalIncome - totalExpense,
          savingsRate: totalIncome > 0 ? Math.round((Math.max(0, totalIncome - totalExpense) / totalIncome) * 100) : 0,
          totalTransactions: transactions.length,
        },
        categoryBreakdown: Array.from(categoryTotals.values()).sort((a, b) => b.total - a.total),
        budgetPerformance,
        goalSummary: goals.map((g) => ({
          name: g.name,
          target: Number(g.targetAmount),
          current: Number(g.currentAmount),
          progress: Number(g.targetAmount) > 0 ? Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100) : 0,
        })),
        transactions: transactions.map((t) => ({
          id: t.id,
          date: t.transactionDate.toISOString().split('T')[0],
          title: t.title,
          category: t.category.name,
          type: t.type,
          amount: Number(t.amount),
          paymentMethod: t.paymentMethod,
        })),
      },
    });
  } catch (error) {
    console.error('generateReport error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat laporan keuangan.' });
  }
};
