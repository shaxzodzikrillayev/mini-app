import { Pool } from 'pg';
import { Db } from './index';
import {
  User,
  Order,
  Project,
  Service,
  Message,
  PriceItem,
  AiSettings,
} from './types';
import { SCHEMA_SQL } from './tables';

export class PostgresDb implements Db {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, max: 10 });
  }

  async ready(): Promise<void> {
    await this.pool.query(SCHEMA_SQL);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async findOrCreateUser(u: {
    telegramId: string;
    username?: string | null;
    firstName: string;
    language?: string;
  }): Promise<User> {
    const existing = await this.findUserByTelegramId(u.telegramId);
    if (existing) {
      const { rows } = await this.pool.query(
        `UPDATE users SET first_name=$2, language=$3 WHERE id=$1 RETURNING *`,
        [existing.id, u.firstName, u.language ?? existing.language],
      );
      return this.mapUser(rows[0]);
    }
    const { rows } = await this.pool.query(
      `INSERT INTO users (telegram_id, username, first_name, language)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [u.telegramId, u.username ?? null, u.firstName, u.language ?? 'ru'],
    );
    return this.mapUser(rows[0]);
  }

  async findUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const { rows } = await this.pool.query(
      `SELECT * FROM users WHERE telegram_id=$1`,
      [telegramId],
    );
    return rows[0] ? this.mapUser(rows[0]) : undefined;
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    const { rows } = await this.pool.query(`SELECT * FROM users WHERE email=$1`, [email.trim().toLowerCase()]);
    return rows[0] ? this.mapUser(rows[0]) : undefined;
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
    const { rows } = await this.pool.query(
      `INSERT INTO users (email, password_hash, first_name, username, language, auth_type)
       VALUES ($1,$2,$3,$4,$5,'email') RETURNING *`,
      [data.email.trim().toLowerCase(), data.passwordHash, data.firstName, data.username ?? null, data.language ?? 'ru'],
    );
    return this.mapUser(rows[0]);
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const colMap: Record<string, string> = {
      firstName: 'first_name',
      username: 'username',
      email: 'email',
      passwordHash: 'password_hash',
      language: 'language',
    };
    const keys = Object.keys(data).filter((k) => colMap[k] && data[k as keyof User] !== undefined);
    if (!keys.length) return this.getUser(id);
    const set = keys.map((k, i) => `${colMap[k]}=$${i + 1}`).join(', ');
    const values = keys.map((k) => (data as any)[k]);
    const { rows } = await this.pool.query(
      `UPDATE users SET ${set} WHERE id=$${keys.length + 1} RETURNING *`,
      [...values, id],
    );
    return rows[0] ? this.mapUser(rows[0]) : undefined;
  }

  async getUsers(): Promise<User[]> {
    const { rows } = await this.pool.query(`SELECT * FROM users ORDER BY created_at DESC`);
    return rows.map((r) => this.mapUser(r));
  }

  async getUser(id: number): Promise<User | undefined> {
    const { rows } = await this.pool.query(`SELECT * FROM users WHERE id=$1`, [id]);
    return rows[0] ? this.mapUser(rows[0]) : undefined;
  }

  async createOrder(data: {
    userId: number;
    service: string;
    description: string;
    budget?: number | null;
    price?: number | null;
  }): Promise<Order> {
    const { rows } = await this.pool.query(
      `INSERT INTO orders (user_id, service, description, budget, price)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.userId, data.service, data.description, data.budget ?? null, data.price ?? null],
    );
    return this.mapOrder(rows[0]);
  }

  async getOrders(): Promise<Order[]> {
    const { rows } = await this.pool.query(`SELECT * FROM orders ORDER BY created_at DESC`);
    return rows.map((r) => this.mapOrder(r));
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    const { rows } = await this.pool.query(
      `SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC`,
      [userId],
    );
    return rows.map((r) => this.mapOrder(r));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const { rows } = await this.pool.query(`SELECT * FROM orders WHERE id=$1`, [id]);
    return rows[0] ? this.mapOrder(rows[0]) : undefined;
  }

  async updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined> {
    const allowed = ['service', 'description', 'budget', 'price', 'status'];
    const keys = Object.keys(data).filter((k) => allowed.includes(k));
    if (!keys.length) return this.getOrder(id);
    const set = keys.map((k, i) => `${k}=$${i + 1}`).join(', ');
    const values = keys.map((k) => (data as any)[k]);
    const { rows } = await this.pool.query(
      `UPDATE orders SET ${set}, updated_at=NOW() WHERE id=$${keys.length + 1} RETURNING *`,
      [...values, id],
    );
    return rows[0] ? this.mapOrder(rows[0]) : undefined;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(`DELETE FROM orders WHERE id=$1`, [id]);
    return (rowCount ?? 0) > 0;
  }

  async getProjects(publishedOnly = false): Promise<Project[]> {
    const where = publishedOnly ? 'WHERE published=TRUE' : '';
    const { rows } = await this.pool.query(
      `SELECT * FROM projects ${where} ORDER BY created_at DESC`,
    );
    return rows.map((r) => this.mapProject(r));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const { rows } = await this.pool.query(`SELECT * FROM projects WHERE id=$1`, [id]);
    return rows[0] ? this.mapProject(rows[0]) : undefined;
  }

  async createProject(data: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    const { rows } = await this.pool.query(
      `INSERT INTO projects (title, description, image, category, technologies, demo_url, published)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [data.title, data.description, data.image, data.category, data.technologies, data.demoUrl, data.published],
    );
    return this.mapProject(rows[0]);
  }

  async updateProject(id: number, data: Partial<Project>): Promise<Project | undefined> {
    const colMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      image: 'image',
      category: 'category',
      technologies: 'technologies',
      demoUrl: 'demo_url',
      published: 'published',
    };
    const keys = Object.keys(data).filter((k) => colMap[k]);
    if (!keys.length) return this.getProject(id);
    const set = keys.map((k, i) => `${colMap[k]}=$${i + 1}`).join(', ');
    const values = keys.map((k) => (data as any)[k]);
    const { rows } = await this.pool.query(
      `UPDATE projects SET ${set} WHERE id=$${keys.length + 1} RETURNING *`,
      [...values, id],
    );
    return rows[0] ? this.mapProject(rows[0]) : undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(`DELETE FROM projects WHERE id=$1`, [id]);
    return (rowCount ?? 0) > 0;
  }

  async getServices(activeOnly = false): Promise<Service[]> {
    const where = activeOnly ? 'WHERE active=TRUE' : '';
    const { rows } = await this.pool.query(`SELECT * FROM services ${where}`);
    return rows.map((r) => this.mapService(r));
  }

  async getService(id: number): Promise<Service | undefined> {
    const { rows } = await this.pool.query(`SELECT * FROM services WHERE id=$1`, [id]);
    return rows[0] ? this.mapService(rows[0]) : undefined;
  }

  async createService(data: Omit<Service, 'id' | 'createdAt'>): Promise<Service> {
    const { rows } = await this.pool.query(
      `INSERT INTO services (title, description, price, duration, active)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [data.title, data.description, data.price, data.duration, data.active],
    );
    return this.mapService(rows[0]);
  }

  async updateService(id: number, data: Partial<Service>): Promise<Service | undefined> {
    const allowed = ['title', 'description', 'price', 'duration', 'active'];
    const keys = Object.keys(data).filter((k) => allowed.includes(k));
    if (!keys.length) return this.getService(id);
    const set = keys.map((k, i) => `${k}=$${i + 1}`).join(', ');
    const values = keys.map((k) => (data as any)[k]);
    const { rows } = await this.pool.query(
      `UPDATE services SET ${set} WHERE id=$${keys.length + 1} RETURNING *`,
      [...values, id],
    );
    return rows[0] ? this.mapService(rows[0]) : undefined;
  }

  async deleteService(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(`DELETE FROM services WHERE id=$1`, [id]);
    return (rowCount ?? 0) > 0;
  }

  async getMessagesByOrder(orderId: number): Promise<Message[]> {
    const { rows } = await this.pool.query(
      `SELECT * FROM messages WHERE order_id=$1 ORDER BY created_at ASC`,
      [orderId],
    );
    return rows.map((r) => this.mapMessage(r));
  }

  async createMessage(data: { orderId: number; sender: 'admin' | 'client'; message: string }): Promise<Message> {
    const { rows } = await this.pool.query(
      `INSERT INTO messages (order_id, sender, message) VALUES ($1,$2,$3) RETURNING *`,
      [data.orderId, data.sender, data.message],
    );
    return this.mapMessage(rows[0]);
  }

  async getPriceItems(): Promise<PriceItem[]> {
    const { rows } = await this.pool.query(`SELECT * FROM price_items`);
    return rows.map((r) => this.mapPriceItem(r));
  }

  async updatePriceItem(id: number, value: number): Promise<PriceItem | undefined> {
    const { rows } = await this.pool.query(
      `UPDATE price_items SET value=$2 WHERE id=$1 RETURNING *`,
      [id, value],
    );
    return rows[0] ? this.mapPriceItem(rows[0]) : undefined;
  }

  async createPriceItem(data: Omit<PriceItem, 'id'>): Promise<PriceItem> {
    const { rows } = await this.pool.query(
      `INSERT INTO price_items (key, label, value, "group") VALUES ($1,$2,$3,$4) RETURNING *`,
      [data.key, data.label, data.value, data.group],
    );
    return this.mapPriceItem(rows[0]);
  }

  async deletePriceItem(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(`DELETE FROM price_items WHERE id=$1`, [id]);
    return (rowCount ?? 0) > 0;
  }

  async getAiSettings(): Promise<AiSettings> {
    const { rows } = await this.pool.query(`SELECT * FROM ai_settings WHERE id=1`);
    return rows[0]
      ? this.mapAiSettings(rows[0])
      : { id: 1, systemPrompt: '', updatedAt: new Date().toISOString() };
  }

  async updateAiSettings(prompt: string): Promise<AiSettings> {
    const existing = await this.getAiSettings();
    if (existing.id === 1) {
      const { rows } = await this.pool.query(
        `UPDATE ai_settings SET system_prompt=$1, updated_at=NOW() WHERE id=1 RETURNING *`,
        [prompt],
      );
      return this.mapAiSettings(rows[0]);
    }
    const { rows } = await this.pool.query(
      `INSERT INTO ai_settings (id, system_prompt) VALUES (1, $1) RETURNING *`,
      [prompt],
    );
    return this.mapAiSettings(rows[0]);
  }

  async getStats(): Promise<{
    newOrders: number;
    activeProjects: number;
    completedProjects: number;
    revenue: number;
    users: number;
  }> {
    const activeStatuses = ['На рассмотрении', 'В работе', 'Проверка'];
    const [newOrders, activeProjects, completedProjects, revenue, users] = await Promise.all([
      this.pool.query(`SELECT COUNT(*)::int AS c FROM orders WHERE status='Новый'`),
      this.pool.query(`SELECT COUNT(*)::int AS c FROM orders WHERE status = ANY($1)`, [activeStatuses]),
      this.pool.query(`SELECT COUNT(*)::int AS c FROM orders WHERE status='Завершён'`),
      this.pool.query(`SELECT COALESCE(SUM(price),0)::int AS s FROM orders`),
      this.pool.query(`SELECT COUNT(*)::int AS c FROM users`),
    ]);
    return {
      newOrders: newOrders.rows[0].c,
      activeProjects: activeProjects.rows[0].c,
      completedProjects: completedProjects.rows[0].c,
      revenue: revenue.rows[0].s,
      users: users.rows[0].c,
    };
  }

  private mapUser(r: any): User {
    return { id: r.id, telegramId: r.telegram_id, email: r.email, passwordHash: r.password_hash, authType: r.auth_type || 'telegram', username: r.username, firstName: r.first_name, language: r.language, createdAt: r.created_at };
  }
  private mapOrder(r: any): Order {
    return { id: r.id, orderNumber: r.order_number, userId: r.user_id, service: r.service, description: r.description, budget: r.budget, price: r.price, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at };
  }
  private mapProject(r: any): Project {
    return { id: r.id, title: r.title, description: r.description, image: r.image, category: r.category, technologies: r.technologies, demoUrl: r.demo_url, published: r.published, createdAt: r.created_at };
  }
  private mapService(r: any): Service {
    return { id: r.id, title: r.title, description: r.description, price: r.price, duration: r.duration, active: r.active, createdAt: r.created_at };
  }
  private mapMessage(r: any): Message {
    return { id: r.id, orderId: r.order_id, sender: r.sender, message: r.message, createdAt: r.created_at };
  }
  private mapPriceItem(r: any): PriceItem {
    return { id: r.id, key: r.key, label: r.label, value: r.value, group: r.group };
  }
  private mapAiSettings(r: any): AiSettings {
    return { id: r.id, systemPrompt: r.system_prompt, updatedAt: r.updated_at };
  }
}
