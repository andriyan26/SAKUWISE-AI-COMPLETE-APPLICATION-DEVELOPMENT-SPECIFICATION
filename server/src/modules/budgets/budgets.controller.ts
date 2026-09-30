import { Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../config/db.js';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';

export const getBudgets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { period } = req.query as { period?: string };

    const now = new Date();
    // Default to current month if no filter
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute spent amount for each budget based on transactions within the budget's period
    const budgetsWithProgress = await Promise.all(
      budgets.map(async (b) => {
        const spentAgg = await prisma.transaction.aggregate({
          where: {
            userId,
            type: 'EXPENSE',
            transactionDate: {
              gte: b.periodStart,
              lte: b.periodEnd,
            },
            ...(b.categoryId ? { categoryId: b.categoryId } : {}),
          },
          _sum: {
            amount: true,
          },
        });

        const spent = Number(spentAgg._sum.amount || 0);
        const limit = Number(b.amount);
        const remaining = Math.max(0, limit - spent);
        const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

        let status = 'NORMAL';
        if (percentage >= 100) {
          status = 'EXCEEDED';
        } else if (percentage >= b.alertThreshold) {
          status = 'WARNING';
        }

        return {
          id: b.id,
          name: b.name,
          categoryId: b.categoryId,
          category: b.category,
          amount: limit,
          spentAmount: spent,
          remainingAmount: remaining,
          percentageUsed: percentage,
          alertThreshold: b.alertThreshold,
          periodStart: b.periodStart,
          periodEnd: b.periodEnd,
          status,
          createdAt: b.createdAt,
        };
      })
    );

    // Calculate total overview
    const totalBudgetLimit = budgetsWithProgress.reduce((acc, b) => acc + b.amount, 0);
    const totalSpent = budgetsWithProgress.reduce((acc, b) => acc + b.spentAmount, 0);
    const totalRemaining = Math.max(0, totalBudgetLimit - totalSpent);

    res.json({
      success: true,
      data: budgetsWithProgress,
      overview: {
        totalBudgetLimit,
        totalSpent,
        totalRemaining,
        overallPercentage: totalBudgetLimit > 0 ? Math.round((totalSpent / totalBudgetLimit) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('getBudgets error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data anggaran.' });
  }
};

export const createBudget = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, categoryId, amount, periodStart, periodEnd, alertThreshold = 80 } = req.body;

    const newBudget = await prisma.budget.create({
      data: {
        userId,
        name,
        categoryId: categoryId || null,
        amount: new Prisma.Decimal(amount),
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        alertThreshold: parseInt(alertThreshold, 10) || 80,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({
      success: true,
      data: newBudget,
      message: 'Anggaran berhasil dibuat!',
    });
  } catch (error) {
    console.error('createBudget error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat anggaran.' });
  }
};

export const updateBudget = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { name, categoryId, amount, periodStart, periodEnd, alertThreshold } = req.body;

    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Anggaran tidak ditemukan atau bukan milik Anda.' });
      return;
    }

    const updated = await prisma.budget.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
        ...(amount !== undefined ? { amount: new Prisma.Decimal(amount) } : {}),
        periodStart: periodStart ? new Date(periodStart) : existing.periodStart,
        periodEnd: periodEnd ? new Date(periodEnd) : existing.periodEnd,
        alertThreshold: alertThreshold !== undefined ? parseInt(alertThreshold, 10) : existing.alertThreshold,
      },
      include: {
        category: true,
      },
    });

    res.json({ success: true, data: updated, message: 'Anggaran berhasil diperbarui.' });
  } catch (error) {
    console.error('updateBudget error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui anggaran.' });
  }
};

export const deleteBudget = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Anggaran tidak ditemukan.' });
      return;
    }

    await prisma.budget.delete({ where: { id } });

    res.json({ success: true, message: 'Anggaran berhasil dihapus.' });
  } catch (error) {
    console.error('deleteBudget error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus anggaran.' });
  }
};
