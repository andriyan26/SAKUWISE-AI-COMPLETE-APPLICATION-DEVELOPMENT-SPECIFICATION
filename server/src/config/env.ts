import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/sakuwise_ai',
  JWT_SECRET: process.env.JWT_SECRET || 'sakuwise_super_secure_jwt_secret_key_2026_finance_ai',
  SESSION_SECRET: process.env.SESSION_SECRET || 'sakuwise_session_secret_key_987654321',
  AI_PROVIDER: process.env.AI_PROVIDER || 'mock',
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'gpt-4o-mini',
  AI_BASE_URL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'local',
  STORAGE_DIR: process.env.STORAGE_DIR || './uploads',
  OCR_PROVIDER: process.env.OCR_PROVIDER || 'mock',
};
