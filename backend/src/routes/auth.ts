import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { AuthedRequest, authTelegram } from '../middleware/auth';
import { db } from '../db/factory';
import { config } from '../config';
import { hashPassword, verifyPassword } from '../lib/password';

const router = Router();

function signUserToken(uid: number): string {
  return jwt.sign({ type: 'user', uid }, config.jwtSecret, { expiresIn: '30d' });
}

function publicUser(u: any) {
  return {
    id: u.id,
    firstName: u.firstName,
    username: u.username,
    email: u.email,
    language: u.language,
    authType: u.authType,
    telegramId: u.telegramId,
    createdAt: u.createdAt,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Register a new email account. After registration the user is logged in.
router.post('/register', async (req, res) => {
  const firstName = String(req.body?.firstName || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const username = req.body?.username != null ? String(req.body.username).trim() : null;
  const password = String(req.body?.password || '');
  const confirm = String(req.body?.confirm || '');

  if (!firstName) return res.status(400).json({ error: 'Введите имя.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Введите корректный email.' });
  if (password.length < 6) return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов.' });
  if (password !== confirm) return res.status(400).json({ error: 'Пароли не совпадают.' });

  try {
    const user = await db.createEmailUser({
      email,
      passwordHash: hashPassword(password),
      firstName,
      username,
    });
    const token = signUserToken(user.id);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (e: any) {
    const msg = String(e?.message || '');
    if (/exist|duplicate|уже существует|already/i.test(msg)) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует.' });
    }
    res.status(500).json({ error: 'Не удалось зарегистрироваться. Попробуйте ещё раз.' });
  }
});

// Login with email + password.
router.post('/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) return res.status(400).json({ error: 'Введите email и пароль.' });

  const user = await db.findUserByEmail(email);
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Неверный email или пароль.' });
  }

  const token = signUserToken(user.id);
  res.json({ token, user: publicUser(user) });
});

// Logout (stateless JWT — the client discards the token).
router.post('/logout', (_req, res) => {
  res.json({ ok: true });
});

// Current session user (email JWT or Telegram session).
router.get('/me', authTelegram, async (req: AuthedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Не авторизован.' });
  res.json(publicUser(req.user));
});

// Update profile (name, username, language, password).
router.put('/update', authTelegram, async (req: AuthedRequest, res) => {
  const user = await db.getUser(req.user.id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден.' });

  const data: any = {};
  if (req.body?.firstName !== undefined) {
    const v = String(req.body.firstName).trim();
    if (!v) return res.status(400).json({ error: 'Имя не может быть пустым.' });
    data.firstName = v;
  }
  if (req.body?.username !== undefined) data.username = String(req.body.username).trim() || null;
  if (req.body?.language !== undefined) data.language = String(req.body.language).trim();

  // Optional password change (require current password).
  const newPassword = req.body?.newPassword?.trim();
  if (newPassword) {
    if (newPassword.length < 6) return res.status(400).json({ error: 'Новый пароль должен содержать минимум 6 символов.' });
    if (!user.passwordHash) return res.status(400).json({ error: 'У Telegram-аккаунта нет пароля.' });
    const current = String(req.body?.currentPassword || '');
    if (!verifyPassword(current, user.passwordHash)) return res.status(401).json({ error: 'Текущий пароль указан неверно.' });
    data.passwordHash = hashPassword(newPassword);
  }

  const updated = await db.updateUser(user.id, data);
  res.json(publicUser(updated));
});

export default router;
