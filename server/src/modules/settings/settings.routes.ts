import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate-request.js';
import {
  getSettings,
  updateSettings,
  changePassword,
  exportUserData,
  deleteAccount,
  uploadAvatar,
} from './settings.controller.js';

const router = Router();

// Setup avatar upload directory
const avatarUploadDir = path.resolve(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(avatarUploadDir)) {
  fs.mkdirSync(avatarUploadDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarUploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Harap unggah file gambar (JPG, PNG, WEBP).'));
    }
  },
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Kata sandi saat ini wajib diisi'),
    newPassword: z.string().min(6, 'Kata sandi baru minimal 6 karakter'),
  }),
});

router.use(authenticate);

router.get('/', getSettings);
router.patch('/', updateSettings);
router.post('/avatar', avatarUpload.single('avatar'), uploadAvatar);
router.post('/change-password', validateRequest(changePasswordSchema), changePassword);
router.get('/export-data', exportUserData);
router.delete('/account', deleteAccount);

export default router;

