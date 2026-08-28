export interface User {
  id: number;
  telegramId: string | null;
  email: string | null;
  passwordHash: string | null;
  authType: 'telegram' | 'email';
  username: string | null;
  firstName: string;
  language: string;
  createdAt: string;
}

export type OrderStatus =
  | 'Новый'
  | 'На рассмотрении'
  | 'В работе'
  | 'Проверка'
  | 'Завершён'
  | 'Отменён';

/** Linear progression statuses (used for the progress bar). */
export const ORDER_STATUSES: OrderStatus[] = [
  'Новый',
  'На рассмотрении',
  'В работе',
  'Проверка',
  'Завершён',
  'Отменён',
];

/** Statuses currently considered "active"/in-progress for dashboard stats. */
export const ACTIVE_STATUSES: OrderStatus[] = ['На рассмотрении', 'В работе', 'Проверка'];

export interface Order {
  id: number;
  orderNumber: number;
  userId: number;
  service: string;
  description: string;
  budget: number | null;
  price: number | null;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  image: string | null;
  category: string;
  technologies: string;
  demoUrl: string | null;
  published: boolean;
  createdAt: string;
}

export interface Service {
  id: number;
  title: string;
  description: string;
  price: number | null;
  duration: string | null;
  active: boolean;
  createdAt: string;
}

export interface Message {
  id: number;
  orderId: number;
  sender: 'admin' | 'client';
  message: string;
  createdAt: string;
}

export interface PriceItem {
  id: number;
  key: string;
  label: string;
  value: number;
  group: string;
}

export interface AiSettings {
  id: number;
  systemPrompt: string;
  updatedAt: string;
}

export interface UserRow extends User {}
