import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layout & Protected Route
import { AppShell } from './components/layout/AppShell.js';
import { ProtectedRoute } from './components/auth/ProtectedRoute.js';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage.js';
import { RegisterPage } from './pages/auth/RegisterPage.js';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.js';
import { OnboardingPage } from './pages/onboarding/OnboardingPage.js';

// App Pages
import { DashboardPage } from './pages/dashboard/DashboardPage.js';
import { TransactionsPage } from './pages/transactions/TransactionsPage.js';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage.js';
import { BudgetsPage } from './pages/budgets/BudgetsPage.js';
import { GoalsPage } from './pages/goals/GoalsPage.js';
import { ReportsPage } from './pages/reports/ReportsPage.js';
import { AIAssistantPage } from './pages/ai/AIAssistantPage.js';
import { SettingsPage } from './pages/settings/SettingsPage.js';
import { HelpPage } from './pages/help/HelpPage.js';

export const router = createBrowserRouter([
  // Public Auth Routes
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },

  // Protected App Shell Routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'transactions',
        element: <TransactionsPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'budgets',
        element: <BudgetsPage />,
      },
      {
        path: 'goals',
        element: <GoalsPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'ai-assistant',
        element: <AIAssistantPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'help',
        element: <HelpPage />,
      },
    ],
  },

  // Fallback
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
