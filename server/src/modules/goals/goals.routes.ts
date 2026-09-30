import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate-request.js';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  addContribution,
} from './goals.controller.js';

const router = Router();

const goalSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Nama target wajib diisi'),
    description: z.string().optional().nullable(),
    targetAmount: z.number().positive('Jumlah target harus lebih dari 0'),
    currentAmount: z.number().min(0).optional(),
    targetDate: z.string().min(1, 'Tanggal target wajib diisi'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    icon: z.string().optional(),
  }),
});

const contributionSchema = z.object({
  body: z.object({
    amount: z.number().positive('Jumlah setoran harus lebih dari 0'),
    note: z.string().optional().nullable(),
    contributionDate: z.string().optional(),
  }),
});

router.use(authenticate);

router.get('/', getGoals);
router.post('/', validateRequest(goalSchema), createGoal);
router.patch('/:id', updateGoal);
router.delete('/:id', deleteGoal);
router.post('/:id/contributions', validateRequest(contributionSchema), addContribution);

export default router;
