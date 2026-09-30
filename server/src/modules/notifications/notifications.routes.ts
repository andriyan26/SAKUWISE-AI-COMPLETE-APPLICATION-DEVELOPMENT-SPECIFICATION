import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from './notifications.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);

export default router;
