import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate-request.js';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  exportTransactionsCsv,
} from './transactions.controller.js';

const router = Router();

const transactionSchema = z.object({
  body: z.object({
    categoryId: z.string().min(1, 'Kategori wajib dipilih'),
    type: z.enum(['INCOME', 'EXPENSE'], {
      errorMap: () => ({ message: 'Tipe harus INCOME atau EXPENSE' }),
    }),
    title: z.string().min(1, 'Judul transaksi wajib diisi'),
    amount: z.number().positive('Jumlah harus lebih dari 0'),
    description: z.string().optional().nullable(),
    merchant: z.string().optional().nullable(),
    paymentMethod: z.string().optional().default('Tunai'),
    transactionDate: z.string().optional(),
    receiptId: z.string().optional().nullable(),
  }),
});

router.use(authenticate);

router.get('/', getTransactions);
router.get('/export/csv', exportTransactionsCsv);
router.get('/:id', getTransactionById);
router.post('/', validateRequest(transactionSchema), createTransaction);
router.patch('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
