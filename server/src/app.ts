import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { ENV } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';

// Route modules
import authRoutes from './modules/auth/auth.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import transactionsRoutes from './modules/transactions/transactions.routes.js';
import categoriesRoutes from './modules/categories/categories.routes.js';
import budgetsRoutes from './modules/budgets/budgets.routes.js';
import goalsRoutes from './modules/goals/goals.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import receiptsRoutes from './modules/receipts/receipts.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';

export const createApp = (): express.Application => {
  const app = express();

  // Middleware
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      // Allow localhost in any port
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      // Allow live domains (including sakuwiseai.tplp004.com)
      if (origin.includes('tplp004.com') || origin === ENV.FRONTEND_URL) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  }));
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static uploads directory
  const uploadsPath = path.resolve(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      application: 'SAKUWISE AI Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // API v1 routes
  const apiV1 = express.Router();
  apiV1.use('/auth', authRoutes);
  apiV1.use('/dashboard', dashboardRoutes);
  apiV1.use('/transactions', transactionsRoutes);
  apiV1.use('/categories', categoriesRoutes);
  apiV1.use('/budgets', budgetsRoutes);
  apiV1.use('/goals', goalsRoutes);
  apiV1.use('/analytics', analyticsRoutes);
  apiV1.use('/ai', aiRoutes);
  apiV1.use('/receipts', receiptsRoutes);
  apiV1.use('/reports', reportsRoutes);
  apiV1.use('/notifications', notificationsRoutes);
  apiV1.use('/settings', settingsRoutes);

  app.use('/api/v1', apiV1);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;
