import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/db.js';
import { signToken, cookieOptions } from '../../utils/jwt.js';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';

const DEFAULT_CATEGORIES = [
  // Expenses
  { name: 'Makan & Minum', type: 'EXPENSE', icon: 'Utensils', color: '#EF4444' },
  { name: 'Transportasi', type: 'EXPENSE', icon: 'Car', color: '#F97316' },
  { name: 'Belanja', type: 'EXPENSE', icon: 'ShoppingBag', color: '#EC4899' },
  { name: 'Tagihan', type: 'EXPENSE', icon: 'FileText', color: '#EAB308' },
  { name: 'Hiburan', type: 'EXPENSE', icon: 'Film', color: '#8B5CF6' },
  { name: 'Kesehatan', type: 'EXPENSE', icon: 'Activity', color: '#06B6D4' },
  { name: 'Pendidikan', type: 'EXPENSE', icon: 'BookOpen', color: '#3B82F6' },
  { name: 'Tempat Tinggal', type: 'EXPENSE', icon: 'Home', color: '#10B981' },
  { name: 'Langganan', type: 'EXPENSE', icon: 'CreditCard', color: '#6366F1' },
  { name: 'Lainnya (Pengeluaran)', type: 'EXPENSE', icon: 'MoreHorizontal', color: '#64748B' },
  // Incomes
  { name: 'Gaji', type: 'INCOME', icon: 'Briefcase', color: '#16A34A' },
  { name: 'Freelance', type: 'INCOME', icon: 'Laptop', color: '#0EA5E9' },
  { name: 'Bisnis', type: 'INCOME', icon: 'TrendingUp', color: '#14B8A6' },
  { name: 'Investasi', type: 'INCOME', icon: 'BarChart2', color: '#8B5CF6' },
  { name: 'Hadiah', type: 'INCOME', icon: 'Gift', color: '#F59E0B' },
  { name: 'Lainnya (Pemasukan)', type: 'INCOME', icon: 'PlusCircle', color: '#64748B' },
];

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          passwordHash,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
          onboardingCompleted: false,
        },
      });

      // Seed user default categories
      await tx.category.createMany({
        data: DEFAULT_CATEGORIES.map((cat) => ({
          userId: user.id,
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          color: cat.color,
        })),
      });

      // Create a welcome notification
      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'SYSTEM',
          title: 'Selamat Datang di SAKUWISE AI! 🎉',
          message: 'Mulai kelola keuanganmu dengan bijak dan raih tujuan finansialmu bersama kami.',
        },
      });

      return user;
    });

    const token = signToken({ userId: newUser.id, email: newUser.email });
    res.cookie('token', token, cookieOptions);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil!',
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          avatarUrl: newUser.avatarUrl,
          currency: newUser.currency,
          themePreference: newUser.themePreference,
          onboardingCompleted: newUser.onboardingCompleted,
        },
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Gagal melakukan pendaftaran. Silakan coba lagi.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Email atau kata sandi tidak sesuai.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Email atau kata sandi tidak sesuai.',
      });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email });
    res.cookie('token', token, cookieOptions);

    res.json({
      success: true,
      message: 'Berhasil masuk ke akun!',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          currency: user.currency,
          themePreference: user.themePreference,
          onboardingCompleted: user.onboardingCompleted,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Gagal melakukan autentikasi.' });
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Berhasil keluar dari akun.' });
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Pengguna tidak terautentikasi.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        currency: true,
        timezone: true,
        themePreference: true,
        onboardingCompleted: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil profil pengguna.' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // To prevent user enumeration, always return success message
    if (user) {
      const resetToken = uuidv4();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: resetToken,
          expiresAt,
        },
      });

      // In production an email is sent; for local dev we return the reset link info
      console.log(`[PASSWORD RESET] Token for ${user.email}: ${resetToken}`);
    }

    res.json({
      success: true,
      message: 'Instruksi pemulihan kata sandi telah dikirim jika email terdaftar di sistem kami.',
    });
  } catch (error) {
    console.error('ForgotPassword error:', error);
    res.status(500).json({ success: false, message: 'Gagal memproses permintaan lupa kata sandi.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    const resetTokenRecord = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash: token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetTokenRecord) {
      res.status(400).json({
        success: false,
        message: 'Token pemulihan kata sandi tidak valid atau telah kedaluwarsa.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetTokenRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetTokenRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    res.json({
      success: true,
      message: 'Kata sandi berhasil diperbarui. Silakan masuk menggunakan kata sandi baru Anda.',
    });
  } catch (error) {
    console.error('ResetPassword error:', error);
    res.status(500).json({ success: false, message: 'Gagal mereset kata sandi.' });
  }
};

export const completeOnboarding = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
      return;
    }

    const { financialGoal, monthlyIncome, savingsTarget, currency } = req.body;

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        onboardingCompleted: true,
        currency: currency || 'IDR',
      },
    });

    // Save preferences in user_preferences table
    if (financialGoal) {
      await prisma.userPreference.upsert({
        where: {
          userId_preferenceKey: {
            userId: req.user.id,
            preferenceKey: 'primary_financial_goal',
          },
        },
        create: {
          userId: req.user.id,
          preferenceKey: 'primary_financial_goal',
          preferenceValueJson: JSON.stringify({ goal: financialGoal, monthlyIncome, savingsTarget }),
        },
        update: {
          preferenceValueJson: JSON.stringify({ goal: financialGoal, monthlyIncome, savingsTarget }),
        },
      });
    }

    res.json({
      success: true,
      message: 'Onboarding berhasil diselesaikan! Selamat mengelola keuangan bersama SAKUWISE AI.',
    });
  } catch (error) {
    console.error('CompleteOnboarding error:', error);
    res.status(500).json({ success: false, message: 'Gagal menyimpan data onboarding.' });
  }
};
