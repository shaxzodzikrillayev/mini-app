import express from 'express';
import cors from 'cors';
import { config } from './config';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';

// Well-known deployed frontend URLs (in addition to MINI_APP_URL/ADMIN_URL env).
// Kept here so the deployed Mini App is never blocked by CORS even if the
// backend env vars are not configured yet.
const DEPLOYED_FRONTEND_URLS = [
  'https://mini-app-sooty-five.vercel.app',
];

/**
 * Build the Express app (CORS, routes, error handling).
 *
 * Kept separate from the bootstrapping (local server in src/index.ts and the
 * Vercel serverless handler in api/index.ts), so the exact same app is used
 * everywhere.
 */
export function createApp(): express.Express {
  const app = express();

  const allowedOrigins = [...DEPLOYED_FRONTEND_URLS, config.miniAppUrl, config.adminUrl]
    .filter((x): x is string => typeof x === 'string' && x.length > 0);

  const localhostOrigins =
    config.nodeEnv === 'production'
      ? []
      : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];

  app.use(
    cors({
      origin(origin, cb) {
        // Non-browser requests (curl, server-to-server, Telegram webhook) have no Origin.
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin) || localhostOrigins.includes(origin)) return cb(null, true);
        // Local development: keep the previous permissive behaviour so LAN/phone
        // testing still works. In production we enforce the strict whitelist.
        if (config.nodeEnv !== 'production') return cb(null, true);
        const err: Error & { status?: number } = new Error(`Origin ${origin} not allowed by CORS`);
        err.status = 403;
        return cb(err);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  // Simple request logger (dev only)
  if (config.nodeEnv !== 'production') {
    app.use((req, _res, next) => {
      console.log(`[api] ${req.method} ${req.originalUrl}`);
      next();
    });
  }

  // Health checks (public, outside auth). Registered before the /api router
  // mounts so they are not intercepted by the authTelegram middleware.
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), db: config.databaseUrl ? 'postgres' : 'memory' });
  });

  // Safe configuration diagnostics for the Mini App setup check.
  // Reports ONLY presence (boolean), never actual secret values.
  app.get('/api/health/config', (_req, res) => {
    res.json({
      telegramBotTokenConfigured: !!config.telegramBotToken,
      telegramAdminIdConfigured: !!config.telegramAdminId,
      jwtSecretConfigured: !!config.jwtSecret && config.jwtSecret !== 'change-me-to-a-long-random-string',
      miniAppUrlConfigured: !!config.miniAppUrl,
      adminUrlConfigured: !!config.adminUrl,
      databaseConfigured: !!config.databaseUrl,
      miniAppUrlIsHttps: /^https:\/\//i.test(config.miniAppUrl),
      production: config.nodeEnv === 'production',
    });
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
    const status = Number(err?.status || err?.statusCode) || 500;
    if (status >= 500) console.error('[api] Unhandled error:', err);
    res.status(status).json({
      error:
        status === 403
          ? 'Запрос отклонён: origin не разрешён политикой безопасности.'
          : 'Внутренняя ошибка сервера. Попробуйте ещё раз.',
    });
  });

  return app;
}