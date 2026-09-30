import { Response } from 'express';
import prisma from '../../config/db.js';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';

export const getCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId: null }, { userId }],
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil kategori.' });
  }
};

export const createCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, type, icon, color } = req.body;

    const newCategory = await prisma.category.create({
      data: {
        userId,
        name,
        type: type.toUpperCase(),
        icon: icon || 'Tag',
        color: color || '#635BFF',
      },
    });

    res.status(201).json({ success: true, data: newCategory, message: 'Kategori berhasil dibuat!' });
  } catch (error) {
    console.error('createCategory error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat kategori.' });
  }
};

export const updateCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { name, icon, color } = req.body;

    const existing = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Kategori kustom tidak ditemukan atau bukan milik Anda.' });
      return;
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        icon: icon !== undefined ? icon : existing.icon,
        color: color !== undefined ? color : existing.color,
      },
    });

    res.json({ success: true, data: updated, message: 'Kategori berhasil diperbarui.' });
  } catch (error) {
    console.error('updateCategory error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui kategori.' });
  }
};

export const deleteCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const existing = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Kategori kustom tidak ditemukan atau bukan milik Anda.' });
      return;
    }

    // Check if transactions use this category
    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id },
    });

    if (transactionCount > 0) {
      res.status(400).json({
        success: false,
        message: `Kategori ini masih digunakan oleh ${transactionCount} transaksi. Harap pindahkan transaksi terlebih dahulu.`,
      });
      return;
    }

    await prisma.category.delete({ where: { id } });

    res.json({ success: true, message: 'Kategori berhasil dihapus.' });
  } catch (error) {
    console.error('deleteCategory error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus kategori.' });
  }
};
