import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import {
  getDashboardSummary,
  getDashboardCashFlow,
  getDashboardExpenseBreakdown,
  getDashboardRecentTransactions,
  getDashboardInsights,
} from './dashboard.controller.js';

const router = Router();

router.use(authenticate);

router.get('/summary', getDashboardSummary);
router.get('/cash-flow', getDashboardCashFlow);
router.get('/expense-breakdown', getDashboardExpenseBreakdown);
router.get('/recent-transactions', getDashboardRecentTransactions);
router.get('/insights', getDashboardInsights);

export default router;
