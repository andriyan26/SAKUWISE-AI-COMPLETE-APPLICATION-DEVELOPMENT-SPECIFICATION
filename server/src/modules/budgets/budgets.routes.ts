import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate-request.js';
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from './budgets.controller.js';

const router = Router();

const budgetSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Nama anggaran wajib diisi'),
    categoryId: z.string().optional().nullable(),
    amount: z.number().positive('Jumlah anggaran harus lebih dari 0'),
    periodStart: z.string().min(1, 'Tanggal mulai wajib diisi'),
    periodEnd: z.string().min(1, 'Tanggal selesai wajib diisi'),
    alertThreshold: z.number().min(1).max(100).optional(),
  }),
});

router.use(authenticate);

router.get('/', getBudgets);
router.post('/', validateRequest(budgetSchema), createBudget);
router.patch('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;
