export interface Service {
  id: number;
  title: string;
  description: string;
  price: number | null;
  duration: string | null;
  active: boolean;
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
}

export interface PricePoint {
  id: number;
  key: string;
  label: string;
  value: number;
}

export interface Pricing {
  projectTypes: PricePoint[];
  features: PricePoint[];
}

export type OrderStatus =
  | 'Новый'
  | 'На рассмотрении'
  | 'В работе'
  | 'Проверка'
  | 'Завершён'
  | 'Отменён';

/** Linear progression statuses used by the progress bar. */
export const ORDER_FLOW: OrderStatus[] = [
  'Новый',
  'На рассмотрении',
  'В работе',
  'Проверка',
  'Завершён',
];

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

export interface Message {
  id: number;
  orderId: number;
  sender: 'admin' | 'client';
  message: string;
  createdAt: string;
}

export interface OrderDetailData {
  order: Order;
  messages: Message[];
}

export interface AppUser {
  id: number;
  firstName: string;
  username: string | null;
  email: string | null;
  language: string;
  authType: 'telegram' | 'email';
  telegramId: string | null;
  createdAt: string;
}

export interface ProductUser {
  id: number;
  firstName: string;
  username: string | null;
  email: string | null;
  language: string;
  authType: 'telegram' | 'email';
  telegramId: string | null;
  createdAt: string;
}

export interface Me {
  user: AppUser;
  orderCount: number;
  activeProjects: number;
}
