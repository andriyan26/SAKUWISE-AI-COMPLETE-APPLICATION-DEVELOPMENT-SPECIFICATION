import { Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../config/db.js';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';

export const getTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      search,
      type,
      categoryId,
      startDate,
      endDate,
      paymentMethod,
      sortBy = 'transactionDate',
      sortOrder = 'desc',
      page = '1',
      limit = '10',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.TransactionWhereInput = {
      userId,
    };

    if (type && (type === 'INCOME' || type === 'EXPENSE')) {
      where.type = type;
    }

    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      where.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.transactionDate.lte = end;
      }
    }

    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search.trim() } },
        { description: { contains: search.trim() } },
        { merchant: { contains: search.trim() } },
      ];
    }

    const orderBy: Prisma.TransactionOrderByWithRelationInput = {};
    if (sortBy === 'amount') {
      orderBy.amount = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.transactionDate = sortOrder === 'asc' ? 'asc' : 'desc';
    }

    const [total, transactions] = await prisma.$transaction([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          category: {
            select: { id: true, name: true, icon: true, color: true, type: true },
          },
          receipt: {
            select: { id: true, originalFilename: true, storageKey: true },
          },
        },
      }),
    ]);

    // Aggregate summary for current filter
    const aggregations = await prisma.transaction.groupBy({
      by: ['type'],
      where,
      _sum: {
        amount: true,
      },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    aggregations.forEach((agg) => {
      const val = agg._sum.amount ? Number(agg._sum.amount) : 0;
      if (agg.type === 'INCOME') totalIncome += val;
      if (agg.type === 'EXPENSE') totalExpense += val;
    });

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
      summary: {
        totalIncome,
        totalExpense,
        netCashFlow: totalIncome - totalExpense,
      },
    });
  } catch (error) {
    console.error('getTransactions error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data transaksi.' });
  }
};

export const getTransactionById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: {
        category: true,
        receipt: true,
      },
    });

    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
      return;
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error('getTransactionById error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail transaksi.' });
  }
};

export const createTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      categoryId,
      type,
      title,
      amount,
      description,
      merchant,
      paymentMethod,
      transactionDate,
      receiptId,
    } = req.body;

    // Verify category exists
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        OR: [{ userId: null }, { userId }],
      },
    });

    if (!category) {
      res.status(400).json({ success: false, message: 'Kategori tidak valid.' });
      return;
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        categoryId,
        type: type.toUpperCase(),
        title,
        amount: new Prisma.Decimal(amount),
        description: description || null,
        merchant: merchant || null,
        paymentMethod: paymentMethod || 'Tunai',
        transactionDate: new Date(transactionDate || Date.now()),
        receiptId: receiptId || null,
      },
      include: {
        category: true,
        receipt: true,
      },
    });

    // Check budget alert trigger if this is an expense
    if (transaction.type === 'EXPENSE') {
      const budget = await prisma.budget.findFirst({
        where: {
          userId,
          periodStart: { lte: transaction.transactionDate },
          periodEnd: { gte: transaction.transactionDate },
          OR: [{ categoryId: null }, { categoryId: transaction.categoryId }],
        },
      });

      if (budget) {
        // Calculate total expense for this budget
        const totalSpentAgg = await prisma.transaction.aggregate({
          where: {
            userId,
            type: 'EXPENSE',
            transactionDate: { gte: budget.periodStart, lte: budget.periodEnd },
            ...(budget.categoryId ? { categoryId: budget.categoryId } : {}),
          },
          _sum: { amount: true },
        });

        const spent = Number(totalSpentAgg._sum.amount || 0);
        const limit = Number(budget.amount);
        const percentage = Math.round((spent / limit) * 100);

        if (percentage >= budget.alertThreshold) {
          await prisma.notification.create({
            data: {
              userId,
              type: 'BUDGET_ALERT',
              title: `Peringatan Anggaran: ${budget.name}`,
              message: `Pengeluaran telah mencapai ${percentage}% dari batas anggaran (Rp ${spent.toLocaleString('id-ID')} / Rp ${limit.toLocaleString('id-ID')}).`,
            },
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaksi berhasil disimpan!',
    });
  } catch (error) {
    console.error('createTransaction error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat transaksi baru.' });
  }
};

export const updateTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const {
      categoryId,
      type,
      title,
      amount,
      description,
      merchant,
      paymentMethod,
      transactionDate,
      receiptId,
    } = req.body;

    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan atau bukan milik Anda.' });
      return;
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...(categoryId ? { categoryId } : {}),
        ...(type ? { type: type.toUpperCase() } : {}),
        ...(title ? { title } : {}),
        ...(amount !== undefined ? { amount: new Prisma.Decimal(amount) } : {}),
        description: description !== undefined ? description : existing.description,
        merchant: merchant !== undefined ? merchant : existing.merchant,
        paymentMethod: paymentMethod !== undefined ? paymentMethod : existing.paymentMethod,
        transactionDate: transactionDate ? new Date(transactionDate) : existing.transactionDate,
        receiptId: receiptId !== undefined ? receiptId : existing.receiptId,
      },
      include: {
        category: true,
        receipt: true,
      },
    });

    res.json({ success: true, data: updated, message: 'Transaksi berhasil diperbarui.' });
  } catch (error) {
    console.error('updateTransaction error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui transaksi.' });
  }
};

export const deleteTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan atau bukan milik Anda.' });
      return;
    }

    await prisma.transaction.delete({ where: { id } });

    res.json({ success: true, message: 'Transaksi berhasil dihapus.' });
  } catch (error) {
    console.error('deleteTransaction error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus transaksi.' });
  }
};

export const exportTransactionsCsv = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { transactionDate: 'desc' },
      include: { category: true },
    });

    const header = ['ID', 'Tanggal', 'Judul', 'Tipe', 'Kategori', 'Jumlah (IDR)', 'Metode Pembayaran', 'Merchant', 'Catatan'];
    const rows = transactions.map((t) => [
      t.id,
      t.transactionDate.toISOString().split('T')[0],
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.type,
      `"${(t.category?.name || '').replace(/"/g, '""')}"`,
      Number(t.amount),
      `"${t.paymentMethod}"`,
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="sakuwise_transaksi.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('exportTransactionsCsv error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengekspor data CSV.' });
  }
};
