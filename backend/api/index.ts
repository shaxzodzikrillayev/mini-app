/**
 * Vercel serverless entry point.
 *
 * Compiled/bundled by the @vercel/node builder at deploy time (see vercel.json).
 * Shares the exact same Express app as the local server (src/app.ts).
 *
 * The Telegram bot is NOT started here: long-polling does not work inside
 * serverless functions. Notification methods used by routes no-op safely when
 * the bot has not been started.
 */
import type { IncomingMessage, ServerResponse } from 'http';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { initDbAndReady } from '../src/db/factory';

let app: Express | null = null;
let ready: Promise<Express> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!ready) {
    ready = initDbAndReady().then(() => {
      app = createApp();
      return app;
    });
  }
  const expressApp = await ready;
  // Vercel passes Node http req/res, which are runtime-compatible with the
  // Express Request/Response signatures.
  (expressApp as unknown as (r: IncomingMessage, s: ServerResponse) => void)(req, res);
}