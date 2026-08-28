import {
  User,
  Order,
  Project,
  Service,
  Message,
  PriceItem,
  AiSettings,
} from './types';

export interface Db {
  ready(): Promise<void>;

  // Users
  findOrCreateUser(u: {
    telegramId: string;
    username?: string | null;
    firstName: string;
    language?: string;
  }): Promise<User>;
  findUserByTelegramId(telegramId: string): Promise<User | undefined>;
  findUserByEmail(email: string): Promise<User | undefined>;
  createEmailUser(u: {
    email: string;
    passwordHash: string;
    firstName: string;
    username?: string | null;
    language?: string;
  }): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;

  // Orders
  createOrder(data: {
    userId: number;
    service: string;
    description: string;
    budget?: number | null;
    price?: number | null;
  }): Promise<Order>;
  getOrders(): Promise<Order[]>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  // Projects
  getProjects(publishedOnly?: boolean): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(data: Omit<Project, 'id' | 'createdAt'>): Promise<Project>;
  updateProject(id: number, data: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Services
  getServices(activeOnly?: boolean): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(data: Omit<Service, 'id' | 'createdAt'>): Promise<Service>;
  updateService(id: number, data: Partial<Service>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;

  // Messages
  getMessagesByOrder(orderId: number): Promise<Message[]>;
  createMessage(data: { orderId: number; sender: 'admin' | 'client'; message: string }): Promise<Message>;

  // Pricing
  getPriceItems(): Promise<PriceItem[]>;
  updatePriceItem(id: number, value: number): Promise<PriceItem | undefined>;
  createPriceItem(data: Omit<PriceItem, 'id'>): Promise<PriceItem>;
  deletePriceItem(id: number): Promise<boolean>;

  // AI settings
  getAiSettings(): Promise<AiSettings>;
  updateAiSettings(prompt: string): Promise<AiSettings>;

  // Dashboard stats
  getStats(): Promise<{
    newOrders: number;
    activeProjects: number;
    completedProjects: number;
    revenue: number;
    users: number;
  }>;
}
