export interface DashboardStats {
  newOrders: number;
  activeProjects: number;
  completedProjects: number;
  revenue: number;
  users: number;
}

export type OrderStatus =
  | 'Новый'
  | 'На рассмотрении'
  | 'В работе'
  | 'Проверка'
  | 'Завершён'
  | 'Отменён';

export const ORDER_STATUSES: OrderStatus[] = [
  'Новый',
  'На рассмотрении',
  'В работе',
  'Проверка',
  'Завершён',
  'Отменён',
];

export type BadgeTone = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'purple';

export const ORDER_TONES: Record<OrderStatus, BadgeTone> = {
  'Новый': 'blue',
  'На рассмотрении': 'amber',
  'В работе': 'purple',
  'Проверка': 'blue',
  'Завершён': 'green',
  'Отменён': 'red',
};

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
  user?: { id: number; firstName: string; username: string | null } | null;
}

export interface User {
  id: number;
  telegramId: string;
  username: string | null;
  firstName: string;
  language: string;
  createdAt: string;
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

export interface PriceItem {
  id: number;
  key: string;
  label: string;
  value: number;
  group: string;
}

export interface Message {
  id: number;
  orderId: number;
  sender: 'admin' | 'client';
  message: string;
  createdAt: string;
}
