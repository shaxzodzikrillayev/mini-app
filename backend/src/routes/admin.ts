import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { AuthedRequest, requireAdmin } from '../middleware/auth';
import { db } from '../db/factory';
import { config } from '../config';
import { ORDER_STATUSES } from '../db/types';
import { bot } from '../bot';

const router = Router();

// ---- Auth ----
router.post('/login', async (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');

  if (username === config.adminUsername && password === config.adminPassword) {
    const token = jwt.sign({ role: 'admin', username }, config.jwtSecret, { expiresIn: '7d' });
    res.json({ token, username });
    return;
  }
  res.status(401).json({ error: 'Неверный логин или пароль.' });
});

// ---- Protected admin routes ----
router.use(requireAdmin);

router.get('/me', (req: AuthedRequest, res) => {
  res.json({ username: req.user?.username, role: req.user?.role });
});

router.get('/dashboard', async (_req, res) => {
  res.json(await db.getStats());
});

// Orders
router.get('/orders', async (_req, res) => {
  const orders = await db.getOrders();
  const result = await Promise.all(
    orders.map(async (o) => {
      const user = await db.getUser(o.userId);
      return { ...o, user: user ? { id: user.id, firstName: user.firstName, username: user.username } : null };
    }),
  );
  res.json(result);
});

router.get('/orders/:id', async (req, res) => {
  const order = await db.getOrder(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Заявка не найдена.' });
  const user = await db.getUser(order.userId);
  res.json({ ...order, user: user ? { id: user.id, firstName: user.firstName, username: user.username } : null });
});

router.put('/orders/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { status, price, service, description, budget } = req.body || {};

  const data: any = {};
  if (typeof status === 'string') {
    if (!ORDER_STATUSES.includes(status as any)) {
      return res.status(400).json({ error: 'Некорректный статус.' });
    }
    data.status = status;
  }
  if (price !== undefined) data.price = price === null || price === '' ? null : Number(price);
  if (budget !== undefined) data.budget = budget === null || budget === '' ? null : Number(budget);
  if (typeof service === 'string') data.service = service.trim();
  if (typeof description === 'string') data.description = description.trim();

  const existing = await db.getOrder(id);
  if (!existing) return res.status(404).json({ error: 'Заявка не найдена.' });

  const order = await db.updateOrder(id, data);

  // Send status notification only on an actual status transition.
  if (data.status && typeof data.status === 'string' && data.status !== existing.status) {
    const user = await db.getUser(order!.userId);
    if (user) await bot.notifyUserOrderStatus(user.telegramId as string, order!);
  }

  // Send client message if present
  if (typeof req.body?.message === 'string' && req.body.message.trim()) {
    await db.createMessage({ orderId: id, sender: 'admin', message: req.body.message.trim() });
  }

  res.json(order);
});

router.delete('/orders/:id', async (req, res) => {
  const id = Number(req.params.id);
  const ok = await db.deleteOrder(id);
  if (!ok) return res.status(404).json({ error: 'Заявка не найдена.' });
  res.json({ ok: true });
});

// Messages for an order
router.get('/orders/:id/messages', async (req, res) => {
  const messages = await db.getMessagesByOrder(Number(req.params.id));
  res.json(messages);
});

router.post('/orders/:id/messages', async (req, res) => {
  const id = Number(req.params.id);
  const message = String(req.body?.message || '').trim();
  if (!message) return res.status(400).json({ error: 'Введите сообщение.' });

  const order = await db.getOrder(id);
  if (!order) return res.status(404).json({ error: 'Заявка не найдена.' });

  await db.createMessage({ orderId: id, sender: 'admin', message });

  // Send to the client via Telegram
  const user = await db.getUser(order.userId);
  if (user?.telegramId) await bot.sendDirectMessage(user.telegramId, `💬 Сообщение от Shahzod Web Studio по заказу #${order.orderNumber}:\n\n${message}`);

  res.json({ ok: true });
});

// Users
router.get('/users', async (_req, res) => {
  res.json(await db.getUsers());
});

// Projects
router.get('/projects', async (_req, res) => {
  res.json(await db.getProjects(false));
});

router.post('/projects', async (req, res) => {
  const { title, description, image, category, technologies, demoUrl, published } = req.body || {};
  if (!title || !description) return res.status(400).json({ error: 'Заполните название и описание.' });
  const project = await db.createProject({
    title: String(title).trim(),
    description: String(description).trim(),
    image: image ? String(image) : null,
    category: String(category || 'other').trim(),
    technologies: JSON.stringify(Array.isArray(technologies) ? technologies : String(technologies || '').split(',').map((s: string) => s.trim()).filter(Boolean)),
    demoUrl: demoUrl ? String(demoUrl) : null,
    published: published !== false,
  });
  res.status(201).json(project);
});

router.put('/projects/:id', async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const data: any = {};
  if (b.title !== undefined) data.title = String(b.title).trim();
  if (b.description !== undefined) data.description = String(b.description).trim();
  if (b.image !== undefined) data.image = b.image ? String(b.image) : null;
  if (b.category !== undefined) data.category = String(b.category).trim();
  if (b.technologies !== undefined) data.technologies = JSON.stringify(Array.isArray(b.technologies) ? b.technologies : String(b.technologies).split(',').map((s: string) => s.trim()).filter(Boolean));
  if (b.demoUrl !== undefined) data.demoUrl = b.demoUrl ? String(b.demoUrl) : null;
  if (b.published !== undefined) data.published = !!b.published;

  const project = await db.updateProject(id, data);
  if (!project) return res.status(404).json({ error: 'Проект не найден.' });
  res.json(project);
});

router.delete('/projects/:id', async (req, res) => {
  const ok = await db.deleteProject(Number(req.params.id));
  if (!ok) return res.status(404).json({ error: 'Проект не найден.' });
  res.json({ ok: true });
});

// Services
router.get('/services', async (_req, res) => {
  res.json(await db.getServices(false));
});

router.post('/services', async (req, res) => {
  const { title, description, price, duration, active } = req.body || {};
  if (!title || !description) return res.status(400).json({ error: 'Заполните название и описание.' });
  const service = await db.createService({
    title: String(title).trim(),
    description: String(description).trim(),
    price: price != null ? Number(price) : null,
    duration: duration ? String(duration) : null,
    active: active !== false,
  });
  res.status(201).json(service);
});

router.put('/services/:id', async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const data: any = {};
  if (b.title !== undefined) data.title = String(b.title).trim();
  if (b.description !== undefined) data.description = String(b.description).trim();
  if (b.price !== undefined) data.price = Number(b.price);
  if (b.duration !== undefined) data.duration = b.duration ? String(b.duration) : null;
  if (b.active !== undefined) data.active = !!b.active;

  const service = await db.updateService(id, data);
  if (!service) return res.status(404).json({ error: 'Услуга не найдена.' });
  res.json(service);
});

router.delete('/services/:id', async (req, res) => {
  const ok = await db.deleteService(Number(req.params.id));
  if (!ok) return res.status(404).json({ error: 'Услуга не найдена.' });
  res.json({ ok: true });
});

// Pricing
router.get('/pricing', async (_req, res) => {
  res.json(await db.getPriceItems());
});

router.put('/pricing/:id', async (req, res) => {
  const value = Number(req.body?.value);
  if (Number.isNaN(value)) return res.status(400).json({ error: 'Некорректное значение.' });
  const item = await db.updatePriceItem(Number(req.params.id), value);
  if (!item) return res.status(404).json({ error: 'Пункт не найден.' });
  res.json(item);
});

router.post('/pricing', async (req, res) => {
  const { key, label, value, group } = req.body || {};
  if (!key || !label || value == null || !group) return res.status(400).json({ error: 'Не все поля заполнены.' });
  const item = await db.createPriceItem({ key: String(key), label: String(label), value: Number(value), group: String(group) });
  res.status(201).json(item);
});

router.delete('/pricing/:id', async (req, res) => {
  const ok = await db.deletePriceItem(Number(req.params.id));
  if (!ok) return res.status(404).json({ error: 'Пункт не найден.' });
  res.json({ ok: true });
});

// AI settings
router.get('/ai-settings', async (_req, res) => {
  res.json(await db.getAiSettings());
});

router.put('/ai-settings', async (req, res) => {
  const prompt = String(req.body?.systemPrompt || '').trim();
  if (!prompt) return res.status(400).json({ error: 'Промпт не может быть пустым.' });
  res.json(await db.updateAiSettings(prompt));
});

export default router;
