-- ============================================================
--  Shahzod Web Studio — PostgreSQL schema
--  Run this against your database, OR just set DATABASE_URL
--  and let the backend apply the schema automatically at startup.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id VARCHAR(64) UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255) NOT NULL,
  language VARCHAR(16) DEFAULT 'ru',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Default AI prompt
INSERT INTO ai_settings (id, system_prompt)
VALUES (1, 'You are Shahzod Web Studio AI consultant. Help clients choose services. Never promise exact prices or impossible deadlines.')
ON CONFLICT (id) DO NOTHING;

-- Default calculator prices (editable from the Admin Panel -> Pricing)
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
