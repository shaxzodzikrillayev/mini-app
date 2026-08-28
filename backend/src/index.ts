import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initDbAndReady } from './db/factory';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import { bot } from './bot';

// Never let a stray rejected promise (e.g. a failed Telegram call) silently
// kill the whole backend/bot process.
process.on('unhandledRejection', (reason) => {
  console.warn('[api] unhandledRejection:', reason instanceof Error ? reason.message : reason);
});
process.on('uncaughtException', (err: Error) => {
  console.error('[api] uncaughtException:', err.message);
});

async function main(): Promise<void> {
  await initDbAndReady();

  const app = express();

  const allowedOrigins = [
    config.miniAppUrl,
    config.adminUrl,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        if (config.nodeEnv !== 'production') return cb(null, true);
        return cb(null, true);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  // Simple request logger (dev)
  if (config.nodeEnv !== 'production') {
    app.use((req, _res, next) => {
      console.log(`[api] ${req.method} ${req.originalUrl}`);
      next();
    });
  }

  // Health check (public, outside auth)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), db: config.databaseUrl ? 'postgres' : 'memory' });
  });

  app.use('/api/auth', authRoutes);
  // NOTE: /api/admin MUST be mounted before /api, otherwise the public router
  // (authTelegram middleware) intercepts admin endpoints and returns 401.
  app.use('/api/admin', adminRoutes);
  app.use('/api', publicRoutes);

  // 404 JSON fallback — avoids confusing "endpoint unavailable" HTML responses
  app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint not found.' });
  });

  // Central error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[api] Unhandled error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера. Попробуйте ещё раз.' });
  });

  app.listen(config.port, () => {
    console.log(`[api] Backend listening on http://localhost:${config.port}`);
  });

  // Start Telegram bot
  await bot.start();
}

main().catch((e) => {
  console.error('[api] Failed to start:', e);
  process.exit(1);
});
