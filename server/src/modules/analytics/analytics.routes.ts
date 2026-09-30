import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import {
  getCashFlowAnalytics,
  getExpensesAnalytics,
  getIncomeAnalytics,
  getFinancialHealth,
} from './analytics.controller.js';

const router = Router();

router.use(authenticate);

router.get('/cash-flow', getCashFlowAnalytics);
router.get('/expenses', getExpensesAnalytics);
router.get('/income', getIncomeAnalytics);
router.get('/financial-health', getFinancialHealth);

export default router;
