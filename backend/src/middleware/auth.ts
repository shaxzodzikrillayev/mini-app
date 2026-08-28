import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { validateInitData, parseInitDataUser } from '../lib/telegram';
import { db } from '../db/factory';

export interface AuthedRequest extends Request {
  user?: any;
  telegramUser?: any;
}

/** Finds the current user by JWT (email session) if a valid bearer token present. */
async function resolveJwtUser(req: AuthedRequest): Promise<boolean> {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return false;
  try {
    const payload = jwt.verify(token, config.jwtSecret) as any;
    if (payload && payload.type === 'user' && payload.uid) {
      const user = await db.getUser(payload.uid);
      if (user) {
        req.user = { ...user, id: user.id };
        req.telegramUser = user.telegramId
          ? { id: Number(user.telegramId), first_name: user.firstName || 'User', username: user.username || undefined }
          : undefined;
        return true;
      }
    }
  } catch {
    /* invalid/expired token -> treat as not authed */
  }
  return false;
}

/**
 * Mini-app authentication: accepts either a valid email session (JWT) OR
 * a validated Telegram initData header. In dev mode (no bot token) it
 * falls back to a base64-encoded X-Dev-User header / a default dev user.
 */
export async function authTelegram(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  // 1) Email JWT session takes precedence.
  if (await resolveJwtUser(req)) {
    return next();
  }

  // 2) Telegram initData (production).
  if (config.telegramBotToken) {
    const initData = (req.headers['x-init-data'] as string) || req.body?.initData;
    if (!initData || !validateInitData(initData)) {
      res.status(401).json({ error: 'Unauthorized: invalid Telegram initData.' });
      return;
    }
    const tu = parseInitDataUser(initData);
    if (!tu || tu.id == null) {
      res.status(401).json({ error: 'Unauthorized: invalid Telegram initData.' });
      return;
    }
    req.telegramUser = tu;
    req.user = await db.findOrCreateUser({
      telegramId: String(tu.id),
      username: tu.username || null,
      firstName: tu.first_name || 'User',
      language: tu.language_code || 'ru',
    });
    return next();
  }

  // 3) Dev mode (no bot token): base64 dev user header or default.
  try {
    const raw = req.headers['x-dev-user'] as string;
    if (raw) {
      let json = raw;
      if (!json.includes('"')) json = Buffer.from(json, 'base64').toString('utf8');
      const devUser = JSON.parse(json);
      if (devUser && devUser.id != null) {
        req.telegramUser = devUser;
        req.user = await db.findOrCreateUser({
          telegramId: String(devUser.id),
          username: devUser.username || null,
          firstName: devUser.first_name || 'User',
          language: 'ru',
        });
        return next();
      }
    }
  } catch {
    /* fall through to default dev user */
  }
  req.telegramUser = { id: Number(process.env.DEV_TELEGRAM_ID) || 12345, first_name: 'Dev', username: 'dev' };
  req.user = await db.findOrCreateUser({
    telegramId: String(req.telegramUser.id),
    username: 'dev',
    firstName: 'Dev',
    language: 'ru',
  });
  next();
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret) as any;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: invalid or expired token.' });
  }
}
