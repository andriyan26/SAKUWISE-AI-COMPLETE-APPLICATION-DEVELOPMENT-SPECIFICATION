import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate-request.js';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from './categories.controller.js';

const router = Router();

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Nama kategori wajib diisi'),
    type: z.enum(['INCOME', 'EXPENSE'], {
      errorMap: () => ({ message: 'Tipe harus INCOME atau EXPENSE' }),
    }),
    icon: z.string().optional(),
    color: z.string().optional(),
  }),
});

router.use(authenticate);

router.get('/', getCategories);
router.post('/', validateRequest(createCategorySchema), createCategory);
router.patch('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
