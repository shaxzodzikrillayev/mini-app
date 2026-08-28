import crypto from 'crypto';
import { config } from '../config';

export interface InitDataUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

/**
 * Validates Telegram WebApp initData string using the bot token.
 * Returns the parsed user if valid, otherwise returns undefined.
 */
export function validateInitData(initData: string): boolean {
  if (!config.telegramBotToken) {
    return true; // dev mode without token: accept
  }
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return false;
    params.delete('hash');

    const dataCheckString = [...params.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(config.telegramBotToken).digest();
    const calculated = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculated !== hash) return false;

    // Optionally check auth_date freshness (allow 1 day)
    const authDate = params.get('auth_date');
    if (authDate) {
      const age = Date.now() / 1000 - Number(authDate);
      if (age > 86400) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function parseInitDataUser(initData: string): InitDataUser | null {
  try {
    const params = new URLSearchParams(initData);
    const userRaw = params.get('user');
    if (!userRaw) return null;
    return JSON.parse(userRaw) as InitDataUser;
  } catch {
    return null;
  }
}
