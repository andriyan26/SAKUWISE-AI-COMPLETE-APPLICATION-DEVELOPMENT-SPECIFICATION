import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validate-request.js';
import { authenticate } from '../../middleware/authenticate.js';
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  completeOnboarding,
} from './auth.controller.js';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nama minimal 2 karakter'),
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(1, 'Kata sandi wajib diisi'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Format email tidak valid'),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token pemulihan diperlukan'),
    newPassword: z.string().min(6, 'Kata sandi baru minimal 6 karakter'),
  }),
});

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);
router.post('/onboarding', authenticate, completeOnboarding);

export default router;
