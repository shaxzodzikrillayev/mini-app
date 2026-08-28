import { randomUUID } from 'crypto';
import {
  Db,
} from './index';
import {
  User,
  Order,
  Project,
  Service,
  Message,
  PriceItem,
  AiSettings,
  ORDER_STATUSES,
} from './types';
import { DEFAULT_PRICE_ITEMS } from './tables';

const now = () => new Date().toISOString();

export class MemoryDb implements Db {
  private users: User[] = [];
  private orders: Order[] = [];
  private projects: Project[] = [];
  private services: Service[] = [];
  private messages: Message[] = [];
  private priceItems: PriceItem[] = [];
  private aiSettings: AiSettings[] = [];

  private nextId(rows: { id: number }[]): number {
    return rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
  }

  async ready(): Promise<void> {
    this.priceItems = DEFAULT_PRICE_ITEMS.map((p, i) => ({ id: i + 1, ...p }));
    this.aiSettings = [
      {
        id: 1,
        systemPrompt:
          'You are Shahzod Web Studio AI consultant. Help clients choose services. Never promise exact prices or impossible deadlines.',
        updatedAt: now(),
      },
    ];
    // Seed a couple of demo services for a nicer first-run experience.
    this.seed();
  }

  private seed(): void {
    if (this.services.length) return;
    const demo = [
      { title: '🌐 Landing Page', description: 'Быстрый одностраничный сайт для вашего продукта или бренда. Идеален для запуска рекламы и продажи услуг.', price: 300, duration: '3-5 дней' },
      { title: '🏢 Business Website', description: 'Многостраничный корпоративный сайт компании с информацией об услугах, сотрудниках и контактах.', price: 500, duration: '1-2 недели' },
      { title: '🛒 E-commerce', description: 'Интернет-магазин с корзиной, каталогом и приёмом оплаты. Продавайте онлайн 24/7.', price: 900, duration: '2-4 недели' },
      { title: '🤖 AI Website', description: 'Сайт с AI-функциями: умный поиск, рекомендации, чат-боты и генерация контента.', price: 1200, duration: '2-4 недели' },
      { title: '📱 Telegram Mini App', description: 'Современное приложение внутри Telegram с оплатой, каталогом и личным кабинетом.', price: 800, duration: '1-3 недели' },
      { title: '🤖 Telegram Bot', description: 'Функциональный Telegram-бот: приём заявок, рассылки, интеграции и автоматизация.', price: 400, duration: '3-7 дней' },
      { title: '⚙️ Web App', description: 'Многофункциональное веб-приложение с авторизацией, админкой и базой данных.', price: 1000, duration: '2-5 недель' },
      { title: '📊 Admin Panel', description: 'Удобная админ-панель для управления контентом, заказами и пользователями.', price: 600, duration: '1-2 недели' },
      { title: '🔥 Custom Project', description: 'Индивидуальное решение под вашу уникальную задачу. Разберём и предложим лучшее.', price: 1500, duration: 'по договорённости' },
    ];
    this.services = demo.map((s, i) => ({
      id: i + 1,
      title: s.title,
      description: s.description,
      price: s.price,
      duration: s.duration,
      active: true,
      createdAt: now(),
    }));

    this.projects = [
      {
        id: 1,
        title: 'Кофейня Coffee Lab',
        description: 'Продающий landing page для сети кофеен с онлайн-меню и формой бронирования.',
        image: null,
        category: 'Landing',
        technologies: JSON.stringify(['React', 'Tailwind', 'Node.js']),
        demoUrl: null,
        published: true,
        createdAt: now(),
      },
      {
        id: 2,
        title: 'Магазин техники TechMart',
        description: 'Полноценный интернет-магазин электроники с корзиной и оплатой.',
        image: null,
        category: 'E-commerce',
        technologies: JSON.stringify(['React', 'Node.js', 'PostgreSQL']),
        demoUrl: null,
        published: true,
        createdAt: now(),
      },
      {
        id: 3,
        title: 'Бот для клиники MedBot',
        description: 'Telegram-бот для записи пациентов, напоминаний и консультаций.',
        image: null,
        category: 'Bot',
        technologies: JSON.stringify(['Node.js', 'Telegram API']),
        demoUrl: null,
        published: true,
        createdAt: now(),
      },
    ];
  }

  private buildUser(data: {
    id: number;
    telegramId?: string | null;
    email?: string | null;
    passwordHash?: string | null;
    authType?: 'telegram' | 'email';
    username?: string | null;
    firstName: string;
    language?: string;
  }): User {
    return {
      id: data.id,
      telegramId: data.telegramId ?? null,
      email: data.email ?? null,
      passwordHash: data.passwordHash ?? null,
      authType: data.authType ?? 'telegram',
      username: data.username ?? null,
      firstName: data.firstName,
      language: data.language ?? 'ru',
      createdAt: now(),
    };
  }

  async findOrCreateUser(u: {
    telegramId: string;
    username?: string | null;
    firstName: string;
    language?: string;
  }): Promise<User> {
    let user = await this.findUserByTelegramId(u.telegramId);
    if (user) {
      if (u.firstName && u.firstName !== user.firstName) user.firstName = u.firstName;
      if (u.language) user.language = u.language;
      return user;
    }
    user = this.buildUser({
      id: this.nextId(this.users),
      telegramId: u.telegramId,
      username: u.username,
      firstName: u.firstName,
      language: u.language,
    });
    this.users.push(user);
    return user;
  }

  async findUserByTelegramId(telegramId: string): Promise<User | undefined> {
    return this.users.find((u) => u.telegramId === telegramId);
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    const e = email.trim().toLowerCase();
    return this.users.find((u) => u.email?.toLowerCase() === e);
  }

  async createEmailUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    username?: string | null;
    language?: string;
  }): Promise<User> {
    const existing = await this.findUserByEmail(data.email);
    if (existing) throw new Error('Пользователь с таким email уже существует.');
    const user = this.buildUser({
      id: this.nextId(this.users),
      email: data.email.trim().toLowerCase(),
      passwordHash: data.passwordHash,
      authType: 'email',
      username: data.username,
      firstName: data.firstName,
      language: data.language,
    });
    this.users.push(user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.find((u) => u.id === id);
    if (!user) return undefined;
    if (data.firstName !== undefined) user.firstName = data.firstName;
    if (data.username !== undefined) user.username = data.username;
    if (data.email !== undefined) user.email = data.email;
    if (data.passwordHash !== undefined) user.passwordHash = data.passwordHash;
    if (data.language !== undefined) user.language = data.language;
    return user;
  }

  async getUsers(): Promise<User[]> {
    return [...this.users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }

  async createOrder(data: {
    userId: number;
    service: string;
    description: string;
    budget?: number | null;
    price?: number | null;
  }): Promise<Order> {
    const last = this.orders[this.orders.length - 1];
    const order: Order = {
      id: this.nextId(this.orders),
      orderNumber: last ? last.orderNumber + 1 : 1,
      userId: data.userId,
      service: data.service,
      description: data.description,
      budget: data.budget ?? null,
      price: data.price ?? null,
      status: ORDER_STATUSES[0],
      createdAt: now(),
      updatedAt: now(),
    };
    this.orders.push(order);
    return order;
  }

  async getOrders(): Promise<Order[]> {
    return [...this.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return this.orders
      .filter((o) => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.find((o) => o.id === id);
  }

  async updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined> {
    const o = this.orders.find((x) => x.id === id);
    if (!o) return undefined;
    Object.assign(o, data, { updatedAt: now() });
    return o;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const idx = this.orders.findIndex((o) => o.id === id);
    if (idx === -1) return false;
    this.orders.splice(idx, 1);
    return true;
  }

  async getProjects(publishedOnly = false): Promise<Project[]> {
    const list = publishedOnly ? this.projects.filter((p) => p.published) : this.projects;
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.find((p) => p.id === id);
  }

  async createProject(data: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    const project: Project = { ...data, id: this.nextId(this.projects), createdAt: now() };
    this.projects.push(project);
    return project;
  }

  async updateProject(id: number, data: Partial<Project>): Promise<Project | undefined> {
    const p = this.projects.find((x) => x.id === id);
    if (!p) return undefined;
    Object.assign(p, data);
    return p;
  }

  async deleteProject(id: number): Promise<boolean> {
    const idx = this.projects.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.projects.splice(idx, 1);
    return true;
  }

  async getServices(activeOnly = false): Promise<Service[]> {
    const list = activeOnly ? this.services.filter((s) => s.active) : this.services;
    return [...list];
  }

  async getService(id: number): Promise<Service | undefined> {
    return this.services.find((s) => s.id === id);
  }

  async createService(data: Omit<Service, 'id' | 'createdAt'>): Promise<Service> {
    const service: Service = { ...data, id: this.nextId(this.services), createdAt: now() };
    this.services.push(service);
    return service;
  }

  async updateService(id: number, data: Partial<Service>): Promise<Service | undefined> {
    const s = this.services.find((x) => x.id === id);
    if (!s) return undefined;
    Object.assign(s, data);
    return s;
  }

  async deleteService(id: number): Promise<boolean> {
    const idx = this.services.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    this.services.splice(idx, 1);
    return true;
  }

  async getMessagesByOrder(orderId: number): Promise<Message[]> {
    return this.messages.filter((m) => m.orderId === orderId);
  }

  async createMessage(data: { orderId: number; sender: 'admin' | 'client'; message: string }): Promise<Message> {
    const message: Message = { id: this.nextId(this.messages), createdAt: now(), ...data };
    this.messages.push(message);
    return message;
  }

  async getPriceItems(): Promise<PriceItem[]> {
    return [...this.priceItems];
  }

  async updatePriceItem(id: number, value: number): Promise<PriceItem | undefined> {
    const p = this.priceItems.find((x) => x.id === id);
    if (!p) return undefined;
    p.value = value;
    return p;
  }

  async createPriceItem(data: Omit<PriceItem, 'id'>): Promise<PriceItem> {
    const item: PriceItem = { ...data, id: this.nextId(this.priceItems) };
    this.priceItems.push(item);
    return item;
  }

  async deletePriceItem(id: number): Promise<boolean> {
    const idx = this.priceItems.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.priceItems.splice(idx, 1);
    return true;
  }

  async getAiSettings(): Promise<AiSettings> {
    return this.aiSettings[0];
  }

  async updateAiSettings(prompt: string): Promise<AiSettings> {
    const s = this.aiSettings[0];
    s.systemPrompt = prompt;
    s.updatedAt = now();
    return s;
  }

  async getStats(): Promise<{
    newOrders: number;
    activeProjects: number;
    completedProjects: number;
    revenue: number;
    users: number;
  }> {
    const activeStatuses = ['На рассмотрении', 'В работе', 'Проверка'];
    const newOrders = this.orders.filter((o) => o.status === 'Новый').length;
    const activeProjects = this.orders.filter((o) => activeStatuses.includes(o.status)).length;
    const completedProjects = this.orders.filter((o) => o.status === 'Завершён').length;
    const revenue = this.orders.reduce((sum, o) => sum + (o.price ?? 0), 0);
    return {
      newOrders,
      activeProjects,
      completedProjects,
      revenue,
      users: this.users.length,
    };
  }
}
