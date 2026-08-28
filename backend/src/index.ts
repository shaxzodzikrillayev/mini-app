import { config } from './config';
import { initDbAndReady } from './db/factory';
import { createApp } from './app';
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

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[api] Backend listening on http://localhost:${config.port}`);
  });

  // Start Telegram bot (long-polling — only runs on the local/server process,
  // NOT in the Vercel serverless function).
  await bot.start();
}

main().catch((e) => {
  console.error('[api] Failed to start:', e);
  process.exit(1);
});