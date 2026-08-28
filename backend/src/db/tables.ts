// PostgreSQL schema for the Shahzod Web Studio platform.
// Applied automatically at startup on the "postgres" adapter.

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id VARCHAR(64) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password_hash TEXT,
  auth_type VARCHAR(16) DEFAULT 'telegram',
  username VARCHAR(255),
  first_name VARCHAR(255) NOT NULL,
  language VARCHAR(16) DEFAULT 'ru',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_type VARCHAR(16) DEFAULT 'telegram';

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number SERIAL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  budget NUMERIC,
  price NUMERIC,
  status VARCHAR(64) DEFAULT 'Новый',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image TEXT,
  category VARCHAR(255) NOT NULL,
  technologies TEXT NOT NULL DEFAULT '[]',
  demo_url TEXT,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC,
  duration VARCHAR(64),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender VARCHAR(16) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_items (
  id SERIAL PRIMARY KEY,
  key VARCHAR(64) UNIQUE NOT NULL,
  label VARCHAR(255) NOT NULL,
  value NUMERIC NOT NULL,
  "group" VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_settings (
  id SERIAL PRIMARY KEY,
  system_prompt TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO ai_settings (id, system_prompt)
VALUES (1, 'You are Shahzod Web Studio AI consultant. Help clients choose services. Never promise exact prices or impossible deadlines.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO price_items (key, label, value, "group") VALUES
  ('landing', 'Landing Page', 300, 'project'),
  ('business', 'Business Website', 500, 'project'),
  ('ecommerce', 'E-commerce', 900, 'project'),
  ('ai_website', 'AI Website', 1200, 'project'),
  ('mini_app', 'Telegram Mini App', 800, 'project'),
  ('bot', 'Telegram Bot', 400, 'project'),
  ('web_app', 'Web App', 1000, 'project'),
  ('admin_panel', 'Admin Panel', 600, 'project'),
  ('custom', 'Custom Project', 1500, 'project'),
  ('admin_crud', 'Админка (CRUD)', 200, 'feature'),
  ('payment', 'Оплата', 250, 'feature'),
  ('auth', 'Авторизация', 150, 'feature'),
  ('seo', 'SEO', 100, 'feature'),
  ('crm', 'CRM', 300, 'feature'),
  ('analytics', 'Аналитика', 200, 'feature')
ON CONFLICT (key) DO NOTHING;
`;

// Default pricing used when the price_items table is empty.
export const DEFAULT_PRICE_ITEMS = [
  { key: 'landing', label: 'Landing Page', value: 300, group: 'project' },
  { key: 'business', label: 'Business Website', value: 500, group: 'project' },
  { key: 'ecommerce', label: 'E-commerce', value: 900, group: 'project' },
  { key: 'ai_website', label: 'AI Website', value: 1200, group: 'project' },
  { key: 'mini_app', label: 'Telegram Mini App', value: 800, group: 'project' },
  { key: 'bot', label: 'Telegram Bot', value: 400, group: 'project' },
  { key: 'web_app', label: 'Web App', value: 1000, group: 'project' },
  { key: 'admin_panel', label: 'Admin Panel', value: 600, group: 'project' },
  { key: 'custom', label: 'Custom Project', value: 1500, group: 'project' },

  { key: 'admin_crud', label: 'Админка (CRUD)', value: 200, group: 'feature' },
  { key: 'bot', label: 'Telegram Bot', value: 250, group: 'feature' },
  { key: 'ai', label: 'AI интеграция', value: 400, group: 'feature' },
  { key: 'mini_app', label: 'Telegram Mini App', value: 450, group: 'feature' },
  { key: 'payment', label: 'Оплата', value: 250, group: 'feature' },
  { key: 'auth', label: 'Авторизация', value: 150, group: 'feature' },
  { key: 'seo', label: 'SEO', value: 100, group: 'feature' },
  { key: 'crm', label: 'CRM', value: 300, group: 'feature' },
  { key: 'analytics', label: 'Аналитика', value: 200, group: 'feature' },
];
