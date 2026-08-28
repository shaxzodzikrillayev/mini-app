import { Router } from 'express';
import { AuthedRequest, authTelegram } from '../middleware/auth';
import { db } from '../db/factory';
import { config } from '../config';
import { getConsultantReply } from '../lib/ai';
import { bot } from '../bot';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Protected mini-app routes (validated Telegram initData)
router.use(authTelegram);

// Get or create current user (REST auth middleware already resolves req.user)
async function resolveUser(req: AuthedRequest, res: any) {
  if (req.user) return req.user;
  res.status(401).json({ error: 'Missing user.' });
  return null;
}

router.get('/me', async (req: AuthedRequest, res) => {
  const user = await resolveUser(req, res);
  if (!user) return;
  const orders = await db.getOrdersByUser(user.id);
  const active = orders.filter((o) => ['Новый', 'На рассмотрении', 'В работе', 'Проверка'].includes(o.status));
  res.json({ user, orderCount: orders.length, activeProjects: active.length });
});

// Services
router.get('/services', async (_req, res) => {
  res.json(await db.getServices(true));
});

// Projects (published only)
router.get('/projects', async (_req, res) => {
  res.json(await db.getProjects(true));
});

// Pricing for calculator
router.get('/pricing', async (_req, res) => {
  const items = await db.getPriceItems();
  const group = (g: string) =>
    items.filter((i) => i.group === g).map((i) => ({ id: i.id, key: i.key, label: i.label, value: i.value }));
  res.json({
    projectTypes: group('project'),
    features: group('feature'),
  });
});

// Create order
router.post('/orders', async (req: AuthedRequest, res) => {
  const user = await resolveUser(req, res);
  if (!user) return;

  const service = String(req.body?.service || '').trim();
  const description = String(req.body?.description || '').trim();
  const budget = req.body?.budget != null ? Number(req.body.budget) : null;
  const price = req.body?.price != null ? Number(req.body.price) : null;

  if (!service) return res.status(400).json({ error: 'Укажите услугу.' });
  if (!description) return res.status(400).json({ error: 'Опишите проект.' });

  const order = await db.createOrder({
    userId: user.id,
    service,
    description,
    budget: Number.isNaN(budget) ? null : budget,
    price: Number.isNaN(price) ? null : price,
  });

  // Notify admin
  await bot.notifyAdminNewOrder(order, {
    telegramId: user.telegramId ? Number(user.telegramId) : undefined,
    firstName: user.firstName,
    username: user.username || undefined,
  });

  // Notify the user
  if (user.telegramId) await bot.notifyOrderCreated(user.telegramId, order);

  res.status(201).json(order);
});

// My orders
router.get('/orders', async (req: AuthedRequest, res) => {
  const user = await resolveUser(req, res);
  if (!user) return;
  res.json(await db.getOrdersByUser(user.id));
});

// Order detail (must belong to current user)
router.get('/orders/:id', async (req: AuthedRequest, res) => {
  const user = await resolveUser(req, res);
  if (!user) return;
  const order = await db.getOrder(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Заказ не найден.' });
  if (order.userId !== user.id) return res.status(403).json({ error: 'Нет доступа к этому заказу.' });
  const messages = await db.getMessagesByOrder(order.id);
  res.json({ order, messages });
});

// Client sends a message on their order
router.post('/orders/:id/messages', async (req: AuthedRequest, res) => {
  const user = await resolveUser(req, res);
  if (!user) return;
  const order = await db.getOrder(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Заказ не найден.' });
  if (order.userId !== user.id) return res.status(403).json({ error: 'Нет доступа к этому заказу.' });

  const message = String(req.body?.message || '').trim();
  if (!message) return res.status(400).json({ error: 'Введите сообщение.' });

  await db.createMessage({ orderId: order.id, sender: 'client', message });

  // Notify admin about a new client message via Telegram
  if (config.telegramAdminId && user.telegramId) {
    await bot.sendDirectMessage(
      String(config.telegramAdminId),
      `💬 Новое сообщение от клиента ${user.firstName} по заказу #${order.orderNumber}:\n\n${message}\n\n— ответьте из админ-панели.`,
    );
  }

  res.status(201).json({ ok: true });
});

// AI consultant
router.post('/ai/chat', async (req: AuthedRequest, res) => {
  void resolveUser(req, res);

  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const history = messages
    .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  if (!history.length) return res.status(400).json({ error: 'No messages' });

  const { reply, usedFallback } = await getConsultantReply(history);
  res.json({ reply, usedFallback });
});

// Contact message (from mini app)
router.post('/contact', async (req: AuthedRequest, res) => {
  const user = await resolveUser(req, res);
  if (!user) return;

  const message = String(req.body?.message || '').trim();
  if (!message) return res.status(400).json({ error: 'Введите сообщение.' });

  await bot.notifyAdminNewOrder(
    {
      id: 0,
      orderNumber: 0,
      userId: user.id,
      service: '📞 Обращение из Mini App',
      description: message,
      budget: null,
      price: null,
      status: 'Новый',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { telegramId: user.telegramId ? Number(user.telegramId) : undefined, firstName: user.firstName, username: user.username || undefined },
  ).catch(() => {});

  res.json({ ok: true });
});

export default router;
