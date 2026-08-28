# 🚀 Shahzod Web Studio — Telegram Platform

Полноценная современная система для студии **Shahzod Web Studio**, состоящая из четырёх взаимодействующих частей:

- **🤖 Telegram Bot** — главное меню, языки, уведомления об заявках.
- **📱 Telegram Mini App** — клиентское приложение (React + TS + Vite + Tailwind).
- **⚙️ Backend** — REST API + БД (Node.js + Express + TypeScript).
- **🧑💼 Admin Panel** — защищённая админ-панель для управления заказами, портфолио, услугами, ценами и AI.

---

## 1. Структура проекта

```
Shahzod Web Studio/
├── backend/                 # REST API + Telegram Bot (Node.js + Express + TS)
│   ├── src/
│   │   ├── index.ts         # входная точка сервера
│   │   ├── config.ts        # чтение .env
│   │   ├── bot/             # Telegram Bot (меню, языки, уведомления)
│   │   ├── db/              # слой данных (PostgreSQL + in-memory fallback)
│   │   ├── lib/             # telegram initData, AI-консультант
│   │   ├── middleware/      # auth (Telegram initData + admin JWT)
│   │   └── routes/          # public (mini-app) и admin API
│   └── .env.example
├── mini-app/                # Telegram Mini App (React + TS + Vite + Tailwind)
│   ├── src/
│   │   ├── pages/           # Главная, Услуги, Портфолио, Калькулятор, Заказы, AI, Профиль
│   │   ├── components/      # Layout, ui, toast, статус заказа
│   │   ├── store/           # Zustand (theme, toast)
│   │   └── lib/             # api client, telegram wrapper, types
│   └── .env.example
├── admin/                   # Admin Panel (React + TS + Vite + Tailwind)
│   ├── src/
│   │   ├── pages/           # Login, Dashboard, Orders, Users, Portfolio, Services, Pricing, AI
│   │   └── lib/, store/
│   └── .env.example
├── schema.sql               # PostgreSQL схема (можно применить вручную)
├── package.json             # корневой workspace
└── .gitignore
```

---

## 2. Список созданных файлов

**Backend** (`backend/src/`): `index.ts`, `config.ts`, `bot/index.ts`, `db/index.ts`, `db/memory.ts`, `db/postgres.ts`, `db/types.ts`, `db/tables.ts`, `db/factory.ts`, `lib/telegram.ts`, `lib/ai.ts`, `middleware/auth.ts`, `routes/public.ts`, `routes/admin.ts`, `package.json`, `tsconfig.json`, `.env.example`.

**Mini App** (`mini-app/src/`): `main.tsx`, `App.tsx`, `index.css`, `pages/Home.tsx`, `pages/Services.tsx`, `pages/Portfolio.tsx`, `pages/Calculator.tsx`, `pages/Orders.tsx`, `pages/OrderDetail.tsx`, `pages/AIConsultant.tsx`, `pages/Profile.tsx`, `components/Layout.tsx`, `components/ui.tsx`, `components/Toast.tsx`, `components/OrderStatus.tsx`, `store/theme.ts`, `store/toast.ts`, `lib/api.ts`, `lib/telegram.ts`, `lib/types.ts`, `lib/utils.ts`, `lib/useApi.ts`, `config` files, `.env.example`.

**Admin Panel** (`admin/src/`): `main.tsx`, `App.tsx`, `index.css`, `pages/Login.tsx`, `pages/Dashboard.tsx`, `pages/Orders.tsx`, `pages/OrderDetail.tsx`, `pages/Users.tsx`, `pages/Portfolio.tsx`, `pages/Services.tsx`, `pages/Pricing.tsx`, `pages/AISettings.tsx`, `components/Layout.tsx`, `components/ui.tsx`, `lib/api.ts`, `lib/types.ts`, `lib/utils.ts`, `lib/useApi.ts`, `store/auth.ts`, `store/toast.ts`, `config` files, `.env.example`.

**Корень**: `package.json`, `.gitignore`, `schema.sql`, `README.md`.

---

## 3. Запуск локально

> Нужен Node.js 18+ (проверено на Node 24). Устанавливать PostgreSQL **не обязательно** — если `DATABASE_URL` не задан, backend использует встроенную in-memory БД. Для PostgreSQL задайте `DATABASE_URL`.

### Шаг 1 — установить зависимости (из корня)
```bash
npm install
```

### Шаг 2 — настроить `.env`
```bash
cp backend/.env.example backend/.env
cp mini-app/.env.example mini-app/.env
cp admin/.env.example admin/.env
```
Заполните `backend/.env` как минимум: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_ID`. Всё остальное оставьте по умолчанию для локальной разработки.

### Шаг 3 — запустить в трёх терминалах
```bash
npm run dev:backend    # API + Bot  -> http://localhost:4000
npm run dev:mini-app   # Mini App   -> http://localhost:5173
npm run dev:admin      # Admin Panel-> http://localhost:5174
```

- **Mini App** открывается в браузере: `http://localhost:5173` (вне Telegram автоматически используется dev-режим).
- **Admin Panel**: `http://localhost:5174`, логин по умолчанию `admin` / `admin123`.

### Шаг 4 — production build
```bash
npm run build   # собирает backend, mini-app, admin
```

---

## 4. Env переменные

См. полный список в разделе **10** и в `backend/.env.example`, `mini-app/.env.example`, `admin/.env.example`.

> ⚠️ Никогда не сохраняйте реальный `.env` в Git — он уже в `.gitignore`. В репозиторий попадают только `.env.example` без секретов.

---

## 5. База данных (SQL / схема)

Полная PostgreSQL-схема в `schema.sql`. Backend применяет её автоматически при старте (адаптер `postgres`), либо можете применить вручную:
```bash
psql "$DATABASE_URL" -f schema.sql
```

Таблицы: `users`, `orders`, `projects`, `services`, `messages`, `price_items`, `ai_settings`.

**Режимы БД** (`DB_TYPE` в `backend/.env`):
- `auto` (по умолчанию) — PostgreSQL если есть `DATABASE_URL`, иначе in-memory.
- `postgres` — всегда PostgreSQL.
- `memory` — всегда in-memory.

---

## 6. Создание Telegram Bot

1. Откройте **@BotFather** в Telegram → `/newbot`.
2. Задайте имя и username (например `ShahzodWebStudioBot`).
3. Скопируйте **token** → вставьте в `backend/.env` → `TELEGRAM_BOT_TOKEN`.
4. Узнайте свой Telegram ID (например через **@userinfobot** или `getUpdates`) → `TELEGRAM_ADMIN_ID`.
5. Перезапустите backend. Бот начнёт работу в режиме polling (без внешних адресов). `/start` покажет меню.

---

## 7. Настройка Telegram Mini App

1. В **@BotFather** → `/newapp` (или выберите бота → **Menu Button**).
2. Укажите URL приложения. Локально — http://192.168.x.x:5173 (Vite запускается с `host: true`). В продакшене — ваш HTTPS-домен (например `https://app.yourdomain.com`).
3. В `mini-app/.env` задайте `VITE_API_URL` на ваш backend (локально `http://localhost:4000/api`, в проде `https://api.yourdomain.com/api`).
4. Кнопка **«🚀 Открыть Shahzod Web Studio»** в боте открывает Mini App (через WebApp button, URL из `MINI_APP_URL` в `backend/.env`).

---

## 8. Деплой Frontend (Mini App + Admin)

Оба фронтенда — статические Vite-сборки (`dist/`). Подойдёт любой хостинг (Vercel, Netlify, GitHub Pages, nginx):

```bash
cd mini-app && npm run build   # -> mini-app/dist
cd admin   && npm run build   # -> admin/dist
```

При сборке задайте правильные переменные:
```bash
# mini-app
VITE_API_URL=https://api.yourdomain.com/api

# admin
VITE_API_URL=https://api.yourdomain.com/api/admin
```

Примечания:
- Mini App **обязательно** должен быть открыт через Telegram по HTTPS (Telegram не открывает http-домены в inline-контексте).
- Админка может быть размещена в любом месте (можно закрыть basic-auth'ом для доп. безопасности).

---

## 9. Деплой Backend (+ Bot)

Backend — Node.js сервис (Express). Скомпилируйте `tsc` и запустите:

```bash
cd backend && npm run build && node dist/index.js
```

**На сервере (VPS/за облаком):**
- Установите `DATABASE_URL` (PostgreSQL) — рекомендуется.
- Установите реальные `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_ID`.
- Установите `JWT_SECRET` — длинная случайная строка.
- Установите `ADMIN_USERNAME` / `ADMIN_PASSWORD` — надёжные.
- Установите `PUBLIC_API_URL=https://yourdomain.com`, `MINI_APP_URL`, `ADMIN_URL` — чтобы в уведомлениях бота были правильные ссылки.
- Поставьте за reverse-proxy (nginx/Caddy) с HTTPS.
- Используйте процесс-менеджер (pm2/systemd): `pm2 start dist/index.js`.

**Тип развёртывания бота:** по умолчанию используется **polling** (не требует публичного webhook-URL). Если предпочитаете webhook, настройте его через Bot API (`setWebhook`) — bot-модуль легко расширяется.

---

## 10. Полный список переменных `.env`

### `backend/.env`
| Переменная | Назначение | Пример |
|---|---|---|
| `PORT` | Порт API | `4000` |
| `NODE_ENV` | Режим | `development` / `production` |
| `DB_TYPE` | `auto` / `postgres` / `memory` | `auto` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |
| `TELEGRAM_BOT_TOKEN` | Токен бота (обязательно) | `123456:ABC...` |
| `TELEGRAM_ADMIN_ID` | Telegram ID админа для уведомлений | `123456789` |
| `MINI_APP_URL` | URL Mini App (для кнопок бота + CORS) | `https://app.site.com` |
| `ADMIN_URL` | URL админки (ссылки в уведомлениях) | `https://admin.site.com` |
| `PUBLIC_API_URL` | Публичный базовый URL API | `https://api.site.com` |
| `ADMIN_USERNAME` | Логин админ-панели | `admin` |
| `ADMIN_PASSWORD` | Пароль админ-панели | `StrongPa$$1` |
| `JWT_SECRET` | Секрет для подписи JWT | `random-long-string` |
| `OPENAI_API_KEY` | Ключ OpenAI (пусто = встроенный консультант) | `sk-...` |
| `OPENAI_API_URL` | URL OpenAI-совместимого API | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | Модель | `gpt-4o-mini` |
| `AI_SYSTEM_PROMPT` | Системный промпт по умолчанию | — |
| `DEV_TELEGRAM_ID` | Telegram ID для dev-режима | `12345` |

### `mini-app/.env`
| Переменная | Назначение | Пример |
|---|---|---|
| `VITE_API_URL` | Базовый URL API (плюс `/api`) | `https://api.site.com/api` |

### `admin/.env`
| Переменная | Назначение | Пример |
|---|---|---|
| `VITE_API_URL` | Базовый URL админ API (плюс `/api/admin`) | `https://api.site.com/api/admin` |

---

## 11. Устранение ошибки «Upstream request failed: Endpoint is unavailable»

Эта ошибка означает, что **фронтенд не смог достучаться до API-эндпоинта** (endpoint недоступен/не указан/неправильный). Причины и решения:

1. **Backend не запущен** → эндпоинт физически недоступен. Запустите `npm run dev:backend` и проверьте `http://localhost:4000/api/health`.
2. **Неправильный `VITE_API_URL`** → фронтенд стучится не туда. Проверьте `mini-app/.env` и `admin/.env`.
3. **Неправильный метод/путь** → все маршруты ниже описаны в разделе «API»; убедитесь, что используете GET/POST/PUT/DELETE верно.
4. **CORS** → настроен один раз на backend (`app.use(cors())`), проверялся выше — работает.
5. **Аутентификация** → Mini App требует корректный Telegram WebApp `initData` (валидируется HMAC). Admin API требует JWT (`Authorization: Bearer ...`). Без этого — `401`.
6. **localhost в production** → в прод-сборке `VITE_API_URL` должен указывать на HTTPS-домен, а не на `localhost`. `.env.production` или переменные CI.
7. **AI endpoint** → `OPENAI_API_URL` + `OPENAI_API_KEY`. Без ключа используется встроенный fallback, поэтому ошибка не «подвешивает» чат.
8. **Telegram Bot URL** → кнопка Mini App использует `MINI_APP_URL`; в проде это HTTPS-адрес.

**Обработка ошибок на клиенте** (`mini-app/src/lib/api.ts`, `admin/src/lib/api.ts`):
```
Loading … → Request → Success → показать данные
                        └→ Error → понятное сообщение + кнопка «Попробовать снова»
```
Блоки `try/catch` во всех страницах показывают пользователю сообщение (например «Не удалось подключиться к серверу. Попробуйте ещё раз.») тостами и empty/error states — ошибка не скрывается, а корректно обрабатывается.

---

## 12. API endpoints

### Аутентификация — аккаунты сайта (`/api/auth`) — не требуют Telegram/Admin JWT
| Метод | Путь | Описание |
|---|---|---|
| POST | `/register` | Регистрация (`firstName`, `email`, `password`, `confirm`, опц. `username`). Возвращает `{ token, user }`; дубликат email → `409` |
| POST | `/login` | Вход по email+паролю → `{ token, user }` |
| POST | `/logout` | Выход (клиент удаляет токен) |
| GET | `/me` | Текущий пользователь (по JWT `Bearer`) |
| PUT | `/update` | Обновление профиля (имя, username, язык, смена пароля) |

### Публичные — Mini App (`/api`)
| Метод | Путь | Описание |
|---|---|---|
| GET | `/health` | Проверка здоровья |
| GET | `/me` | Текущий пользователь + статистика |
| GET | `/services` | Активные услуги |
| GET | `/projects` | Опубликованные проекты |
| GET | `/pricing` | Типы проектов + функции (для калькулятора) |
| POST | `/orders` | Создать заявку |
| GET | `/orders` | Мои заявки |
| POST | `/ai/chat` | AI-консультант |
| POST | `/contact` | Обращение / резюме заявки |

### Админ (`/api/admin`) — требуется JWT
| Метод | Путь | Описание |
|---|---|---|
| POST | `/login` | Вход |
| GET | `/me` | Текущий админ |
| GET | `/dashboard` | Статистика |
| GET/PUT/DELETE | `/orders`, `/orders/:id` | Управление заявками |
| GET/POST | `/orders/:id/messages` | Переписка с клиентом |
| GET | `/users` | Пользователи |
| GET/POST/PUT/DELETE | `/projects` | Портфолио |
| GET/POST/PUT/DELETE | `/services` | Услуги |
| GET/POST/PUT/DELETE | `/pricing` | Цены калькулятора |
| GET/PUT | `/ai-settings` | Системный промпт AI |

---

## 13. Уведомления

- **Админу** при новой заявке: текст «🆕 Новая заявка #N», информация о клиенте/проекте/бюджете + кнопки «Открыть заявку», «Связаться с клиентом», «Изменить статус».
- **Клиенту** при смене статуса заказа: «📦 Статус вашего заказа изменился … Новый статус: …».
- **Клиенту** при сообщении админа из админки (поле «Сообщение клиенту» или вкладка переписки).

---

## 14. Безопасность

- Секреты только в `.env`, никогда во frontend/репозитории. Есть `.env.example`.
- Валидация Telegram WebApp `initData` (HMAC SHA-256 по bot token, с проверкой свежести `auth_date`).
- Admin API защищён JWT (`JWT_SECRET`).
- Валидация входящих данных в роутах; централизованный обработчик ошибок; JSON 404 (не HTML).
- CORS, лимиты тела запроса, отсутствие логирования секретов.

---

## 15. AI-консультант

- При наличии `OPENAI_API_KEY` обращается к `OPENAI_API_URL/chat/completions`.
- Системный промпт настраивается в **Admin → AI Settings** (хранится в БД) и по умолчанию запрещает AI называть точные цены/сроки.
- Без ключа работает встроенный fallback-советник — чат всегда отвечает.
- После диалога кнопка «Отправить резюме заявки» отправляет заявку в студию.

---

## 16. Проверка

- `npm run build` (backend + mini-app + admin) — проходит без ошибок.
- Типизация: `tsc --noEmit` во всех сервисах — без ошибок.
- API: 27 автотестов (мини-ап + админ + безопасность) — прошли.
- Telegram initData-валидация — протестирована (важал: доброе проходит, подделанное — отклоняется).
- CORS — проверен для обоих фронтендов.
