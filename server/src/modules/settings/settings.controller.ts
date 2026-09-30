import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/db.js';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';

export const getSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        currency: true,
        timezone: true,
        themePreference: true,
        onboardingCompleted: true,
        preferences: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('getSettings error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil pengaturan.' });
  }
};

export const updateSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, currency, timezone, themePreference, avatarUrl } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name ? { name } : {}),
        ...(currency ? { currency } : {}),
        ...(timezone ? { timezone } : {}),
        ...(themePreference ? { themePreference } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        currency: true,
        timezone: true,
        themePreference: true,
      },
    });

    res.json({ success: true, data: updated, message: 'Pengaturan berhasil diperbarui.' });
  } catch (error) {
    console.error('updateSettings error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui pengaturan.' });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Kata sandi saat ini salah.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    res.json({ success: true, message: 'Kata sandi berhasil diubah.' });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengubah kata sandi.' });
  }
};

export const exportUserData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        categories: true,
        transactions: true,
        budgets: true,
        goals: { include: { contributions: true } },
        aiMemories: true,
        notifications: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    const exportData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        createdAt: user.createdAt,
      },
      categories: user.categories,
      transactions: user.transactions,
      budgets: user.budgets,
      savingsGoals: user.goals,
      aiMemories: user.aiMemories,
      exportedAt: new Date().toISOString(),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="sakuwise_data_${user.email}.json"`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error('exportUserData error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengekspor data pengguna.' });
  }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Delete user (cascade will delete sessions, transactions, goals, etc.)
    await prisma.user.delete({ where: { id: userId } });

    res.clearCookie('token');
    res.json({ success: true, message: 'Akun Anda dan seluruh data keuangan telah berhasil dihapus permanen.' });
  } catch (error) {
    console.error('deleteAccount error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus akun.' });
  }
};

export const uploadAvatar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Harap pilih file gambar avatar.' });
      return;
    }

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const avatarUrl = `${protocol}://${host}/uploads/avatars/${req.file.filename}`;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        currency: true,
      },
    });

    res.json({
      success: true,
      data: updated,
      avatarUrl,
      message: 'Foto avatar berhasil diunggah dan disimpan.',
    });
  } catch (error) {
    console.error('uploadAvatar error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengunggah avatar.' });
  }
};

