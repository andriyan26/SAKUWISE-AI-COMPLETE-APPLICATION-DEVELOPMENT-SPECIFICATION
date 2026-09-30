import prisma from '../../config/db.js';

export interface FinancialSummaryToolResult {
  period: string;
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  savingsRate: number;
  transactionCount: number;
}

export class ToolRegistry {
  static async getFinancialSummary(userId: string, periodDays = 30): Promise<FinancialSummaryToolResult> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const txs = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        transactionDate: { gte: startDate },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    let transactionCount = 0;

    txs.forEach((t) => {
      const amt = Number(t._sum.amount || 0);
      transactionCount += t._count.id;
      if (t.type === 'INCOME') totalIncome += amt;
      if (t.type === 'EXPENSE') totalExpense += amt;
    });

    const netCashFlow = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((Math.max(0, netCashFlow) / totalIncome) * 100) : 0;

    return {
      period: `${periodDays} hari terakhir`,
      totalIncome,
      totalExpense,
      netCashFlow,
      savingsRate,
      transactionCount,
    };
  }

  static async getExpenseBreakdown(userId: string, periodDays = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const breakdown = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        transactionDate: { gte: startDate },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const categories = await prisma.category.findMany({
      where: { id: { in: breakdown.map((b) => b.categoryId) } },
    });
    const catMap = new Map(categories.map((c) => [c.id, c.name]));

    const totalExpense = breakdown.reduce((acc, b) => acc + Number(b._sum.amount || 0), 0);

    return breakdown
      .map((b) => {
        const amt = Number(b._sum.amount || 0);
        return {
          category: catMap.get(b.categoryId) || 'Lainnya',
          amount: amt,
          count: b._count.id,
          percentage: totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }

  static async getBudgetStatus(userId: string) {
    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true },
    });

    return await Promise.all(
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
        const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

        return {
          name: b.name,
          category: b.category?.name || 'Semua Kategori',
          limit,
          spent,
          remaining: Math.max(0, limit - spent),
          percentageUsed: percentage,
          isExceeded: percentage >= 100,
        };
      })
    );
  }

  static async getSavingsGoals(userId: string) {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map((g) => {
      const target = Number(g.targetAmount);
      const current = Number(g.currentAmount);
      return {
        id: g.id,
        name: g.name,
        target,
        current,
        remaining: Math.max(0, target - current),
        progressPercent: target > 0 ? Math.round((current / target) * 100) : 0,
        targetDate: g.targetDate.toISOString().split('T')[0],
        status: g.status,
      };
    });
  }

  static calculateSavingsPlan(targetAmount: number, targetMonths: number) {
    const months = Math.max(1, targetMonths);
    const monthlyNeeded = Math.ceil(targetAmount / months);
    const weeklyNeeded = Math.ceil(targetAmount / (months * 4));
    const dailyNeeded = Math.ceil(targetAmount / (months * 30));

    return {
      targetAmount,
      targetMonths: months,
      monthlyNeeded,
      weeklyNeeded,
      dailyNeeded,
    };
  }

  static async detectSpendingAnomalies(userId: string) {
    // Compare this month against previous month
    const now = new Date();
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [currentTxs, prevTxs] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { userId, type: 'EXPENSE', transactionDate: { gte: currentStart } },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { userId, type: 'EXPENSE', transactionDate: { gte: prevStart, lte: prevEnd } },
        _sum: { amount: true },
      }),
    ]);

    const prevMap = new Map(prevTxs.map((p) => [p.categoryId, Number(p._sum.amount || 0)]));
    const categories = await prisma.category.findMany();
    const catMap = new Map(categories.map((c) => [c.id, c.name]));

    const anomalies = [];
    for (const cur of currentTxs) {
      const curAmt = Number(cur._sum.amount || 0);
      const prevAmt = prevMap.get(cur.categoryId) || 0;
      if (prevAmt > 0 && curAmt > prevAmt * 1.3 && curAmt - prevAmt > 150000) {
        const increasePct = Math.round(((curAmt - prevAmt) / prevAmt) * 100);
        anomalies.push({
          category: catMap.get(cur.categoryId) || 'Kategori',
          currentAmount: curAmt,
          previousAmount: prevAmt,
          increasePercent: increasePct,
          difference: curAmt - prevAmt,
        });
      }
    }

    return anomalies;
  }
}
