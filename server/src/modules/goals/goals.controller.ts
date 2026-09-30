import { Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../config/db.js';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';

export const getGoals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      include: {
        contributions: {
          orderBy: { contributionDate: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const goalsWithMetrics = goals.map((g) => {
      const target = Number(g.targetAmount);
      const current = Number(g.currentAmount);
      const remaining = Math.max(0, target - current);
      const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

      // Estimate monthly savings needed
      const now = new Date();
      const targetDate = new Date(g.targetDate);
      const diffMs = targetDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const diffMonths = Math.max(1, Math.ceil(diffDays / 30));
      const monthlySavingsNeeded = remaining > 0 ? Math.round(remaining / diffMonths) : 0;

      return {
        id: g.id,
        name: g.name,
        description: g.description,
        targetAmount: target,
        currentAmount: current,
        remainingAmount: remaining,
        percentage,
        targetDate: g.targetDate,
        priority: g.priority,
        status: g.status,
        icon: g.icon,
        daysRemaining: Math.max(0, diffDays),
        monthlySavingsNeeded,
        recentContributions: g.contributions.map((c) => ({
          id: c.id,
          amount: Number(c.amount),
          date: c.contributionDate,
          note: c.note,
        })),
        createdAt: g.createdAt,
      };
    });

    res.json({ success: true, data: goalsWithMetrics });
  } catch (error) {
    console.error('getGoals error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data tujuan finansial.' });
  }
};

export const createGoal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, description, targetAmount, currentAmount = 0, targetDate, priority = 'MEDIUM', icon } = req.body;

    const goal = await prisma.savingsGoal.create({
      data: {
        userId,
        name,
        description: description || null,
        targetAmount: new Prisma.Decimal(targetAmount),
        currentAmount: new Prisma.Decimal(currentAmount),
        targetDate: new Date(targetDate),
        priority: priority.toUpperCase(),
        icon: icon || 'Target',
      },
    });

    res.status(201).json({
      success: true,
      data: goal,
      message: 'Tujuan finansial berhasil dibuat!',
    });
  } catch (error) {
    console.error('createGoal error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat tujuan finansial.' });
  }
};

export const updateGoal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { name, description, targetAmount, currentAmount, targetDate, priority, status, icon } = req.body;

    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Tujuan finansial tidak ditemukan.' });
      return;
    }

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        description: description !== undefined ? description : existing.description,
        ...(targetAmount !== undefined ? { targetAmount: new Prisma.Decimal(targetAmount) } : {}),
        ...(currentAmount !== undefined ? { currentAmount: new Prisma.Decimal(currentAmount) } : {}),
        targetDate: targetDate ? new Date(targetDate) : existing.targetDate,
        ...(priority ? { priority: priority.toUpperCase() } : {}),
        ...(status ? { status: status.toUpperCase() } : {}),
        ...(icon !== undefined ? { icon } : {}),
      },
    });

    res.json({ success: true, data: updated, message: 'Tujuan finansial berhasil diperbarui.' });
  } catch (error) {
    console.error('updateGoal error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui tujuan finansial.' });
  }
};

export const deleteGoal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Tujuan finansial tidak ditemukan.' });
      return;
    }

    await prisma.savingsGoal.delete({ where: { id } });

    res.json({ success: true, message: 'Tujuan finansial berhasil dihapus.' });
  } catch (error) {
    console.error('deleteGoal error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus tujuan finansial.' });
  }
};

export const addContribution = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { amount, note, contributionDate } = req.body;

    const goal = await prisma.savingsGoal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      res.status(404).json({ success: false, message: 'Tujuan finansial tidak ditemukan.' });
      return;
    }

    const addAmount = Number(amount);
    const newCurrent = Number(goal.currentAmount) + addAmount;
    const target = Number(goal.targetAmount);
    const isCompleted = newCurrent >= target;

    const result = await prisma.$transaction(async (tx) => {
      const contribution = await tx.savingsContribution.create({
        data: {
          goalId: goal.id,
          userId,
          amount: new Prisma.Decimal(addAmount),
          note: note || 'Setoran tabungan',
          contributionDate: contributionDate ? new Date(contributionDate) : new Date(),
        },
      });

      const updatedGoal = await tx.savingsGoal.update({
        where: { id: goal.id },
        data: {
          currentAmount: new Prisma.Decimal(newCurrent),
          ...(isCompleted ? { status: 'COMPLETED' } : {}),
        },
      });

      if (isCompleted && goal.status !== 'COMPLETED') {
        await tx.notification.create({
          data: {
            userId,
            type: 'GOAL_MILESTONE',
            title: `Selamat! Tujuan Finansial Tercapai! 🏆`,
            message: `Target "${goal.name}" sebesar Rp ${target.toLocaleString('id-ID')} telah sukses 100% terkumpul!`,
          },
        });
      }

      return { contribution, updatedGoal };
    });

    res.status(201).json({
      success: true,
      data: result,
      message: isCompleted
        ? 'Luar biasa! Target tabunganmu telah tercapai 100%! 🎉'
        : 'Setoran tabungan berhasil dicatat!',
    });
  } catch (error) {
    console.error('addContribution error:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan setoran tabungan.' });
  }
};
