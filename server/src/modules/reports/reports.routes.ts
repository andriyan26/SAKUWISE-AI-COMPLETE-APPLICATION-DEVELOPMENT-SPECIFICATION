import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { generateReport } from './reports.controller.js';

const router = Router();

router.use(authenticate);

router.post('/generate', generateReport);

export default router;
