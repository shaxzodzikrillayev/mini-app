import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  dbType: process.env.DB_TYPE || 'auto', // 'postgres' | 'memory' | 'auto'
  databaseUrl: process.env.DATABASE_URL || '',

  // Security
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',

  // Telegram
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramAdminId: process.env.TELEGRAM_ADMIN_ID ? Number(process.env.TELEGRAM_ADMIN_ID) : 0,

  // Frontend URLs (for CORS)
  miniAppUrl: process.env.MINI_APP_URL || 'http://localhost:5173',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:5174',

  // Public API base URL (used to build links in Telegram notifications)
  publicApiUrl: process.env.PUBLIC_API_URL || `http://localhost:${Number(process.env.PORT) || 4000}`,

  // Admin panel initial credentials
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',

  // AI
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiApiUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  aiDefaultPrompt:
    process.env.AI_SYSTEM_PROMPT ||
    'You are Shahzod Web Studio AI consultant. Help clients choose services. Never promise exact prices or impossible deadlines.',
} as const;
