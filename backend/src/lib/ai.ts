import { config } from '../config';
import { db } from '../db/factory';

/**
 * AI consultant. Delegates to an OpenAI-compatible chat completions API.
 * If no API key is configured (or the request fails), falls back to a
 * local heuristic advisor so the feature always responds instead of hanging.
 */
export async function getConsultantReply(
  history: { role: 'user' | 'assistant'; content: string }[],
): Promise<{ reply: string; usedFallback: boolean }> {
  const settings = await db.getAiSettings();
  const systemPrompt =
    settings.systemPrompt ||
    config.aiDefaultPrompt +
      '\nAsk the client about their business, required functions, Telegram/AI needs, budget and deadlines. Do not promise exact prices or impossible deadlines. At the end, offer to send the summary as a request.';

  const fallback = buildFallbackReply(history);

  if (!config.openaiApiKey) {
    return { reply: fallback, usedFallback: true };
  }

  const endpoint = `${config.openaiApiUrl.replace(/\/$/, '')}/chat/completions`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: config.openaiModel,
        messages: [{ role: 'system', content: systemPrompt }, ...history.slice(-20)],
        temperature: 0.6,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn(`[ai] API error ${res.status}: ${body.slice(0, 200)}`);
      return { reply: fallback, usedFallback: true };
    }
    const data = (await res.json()) as any;
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) return { reply: fallback, usedFallback: true };
    return { reply: reply.trim(), usedFallback: false };
  } catch (e) {
    console.warn('[ai] Request failed, using fallback:', (e as Error).message);
    return { reply: fallback, usedFallback: true };
  }
}

function buildFallbackReply(history: { role: 'user' | 'assistant'; content: string }[]): string {
  const lastUser = [...history].reverse().find((m) => m.role === 'user');
  const text = lastUser?.content.toLowerCase() ?? '';

  const hasBudget = /бюджет|\$|usd|сумм|sum|money|price|cost|стоимост/.test(text);
  const hasTelegam = /telegram|телегр/.test(text);
  const hasAI = /\bai\b|искусственн|ии\b|чат-бот|chat.?bot|нейрос|нейросет/.test(text);
  const hasEcom = /e-?commerce|магазин|shop|market|продаж/.test(text);
  const hasLanding = /landing|лендинг|одностраничн|продающ/.test(text);

  const parts: string[] = [];
  parts.push(
    'Я AI-консультант Shahzod Web Studio и помогу подобрать решение. Чтобы дать точную рекомендацию, уточню несколько моментов:',
  );
  if (!hasBudget) parts.push('• Какой у вас примерно бюджет на проект?');
  if (!hasTelegam) parts.push('• Нужна ли интеграция с Telegram (бот или Mini App)?');
  if (!hasAI) parts.push('• Нужны ли AI-функции (например, умный поиск или чат-бот)?');
  if (!hasLanding && !hasEcom) parts.push('• Расскажите, что за бизнес и какие функции важны больше всего?');
  if (hasBudget) parts.push('• Спасибо за ориентир по бюджету — скорректируем решение под него.');
  parts.push(
    '\nТочную цену я не называю, но дам рекомендацию, а финальную смету подготовит менеджер. В конце могу собрать краткое резюме заявки и отправить его в студию.',
  );
  return parts.join('\n');
}
