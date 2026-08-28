import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config';
import { db } from '../db/factory';
import { Order } from '../db/types';

const WEBAPP_URL = (config.miniAppUrl || '').replace(/\/$/, '');

type Lang = 'ru' | 'uz' | 'en';

interface BotUser {
  telegramId?: number;
  firstName: string;
  username?: string;
}

const LANG = {
  ru: {
    welcome:
      '🚀 Добро пожаловать в **Shahzod Web Studio**, {name}! 👋\n\nСоздаём современные сайты, Telegram Mini Apps и цифровые решения для бизнеса.\n\nВыберите нужное действие:',
    openApp: '🚀 Открыть приложение',
    lang: '🌐 Язык',
    services: '💼 Услуги',
    contact: '📞 Связаться с нами',
    order: '🚀 Заказать сайт',
    calc: '💰 Рассчитать стоимость',
    portfolio: '🎨 Портфолио',
    myOrders: '📦 Мои заказы',
    ai: '🤖 AI-консультант',
    profile: '👤 Профиль',
    appMsg:
      '🚀 Открываем **Shahzod Web Studio**…\n\nНажмите кнопку ниже, чтобы запустить приложение прямо в Telegram:',
    helpText:
      '❓ **Помощь — Shahzod Web Studio**\n\nМы создаём современные сайты, Telegram-боты и Mini Apps под ключ.\n\n🚀 Открыть приложение: /app\n💼 Услуги: /services\n🎨 Портфолио: /portfolio\n📦 Мои заказы: /orders\n👤 Профиль: /profile\n\n📋 Главное меню: /start\n\n💬 Telegram: @shahzodwebstudio\n📧 Email: hello@shahzodstudio.com',
    chooseLang: '🌐 Выберите язык:',
    contactText:
      '📞 **Связаться с нами**\n\nНапишите нам — мы на связи 24/7.\n\n💬 Telegram: @shahzodwebstudio\n📧 Email: hello@shahzodstudio.com\n🌐 Сайт: shahzodstudio.com',
    servicesText: '🛠 **Наши услуги:**\n\n🌐 Landing Page\n🏢 Business Website\n🛒 E-commerce\n🤖 AI Website\n📱 Telegram Mini App\n🤖 Telegram Bot\n⚙️ Web App\n📊 Admin Panel\n🔥 Custom Project\n\nПодробнее в Mini App!',
  },
  uz: {
    welcome:
      '🚀 Assalomu alaykum, **Shahzod Web Studio**ga xush kelibsiz, {name}! 👋\n\nZamonaviy saytlar, Telegram Mini Apps va biznes uchun raqamli yechimlar yaratamiz.\n\nKerakli amalni tanlang:',
    openApp: '🚀 Ilovani ochish',
    lang: '🌐 Til',
    services: '💼 Xizmatlar',
    contact: '📞 Biz bilan bog‘lanish',
    order: '🚀 Sayt buyurtma qilish',
    calc: '💰 Narxni hisoblash',
    portfolio: '🎨 Portfolio',
    myOrders: '📦 Buyurtmalarim',
    ai: '🤖 AI-konsultant',
    profile: '👤 Profil',
    appMsg:
      '🚀 **Shahzod Web Studio** ochilmoqda…\n\nIlovani Telegram orqali ishga tushirish uchun quyidagi tugmani bosing:',
    helpText:
      '❓ **Yordam — Shahzod Web Studio**\n\nZamonaviy saytlar, Telegram-botlar va Mini Apps yaratamiz.\n\n🚀 Ilovani ochish: /app\n💼 Xizmatlar: /services\n🎨 Portfolio: /portfolio\n📦 Buyurtmalarim: /orders\n👤 Profil: /profile\n\n📋 Asosiy menyu: /start\n\n💬 Telegram: @shahzodwebstudio\n📧 Email: hello@shahzodstudio.com',
    chooseLang: '🌐 Tilni tanlang:',
    contactText:
      '📞 **Biz bilan bog‘lanish**\n\nBizga yozing — doim aloqadamiz.\n\n💬 Telegram: @shahzodwebstudio\n📧 Email: hello@shahzodstudio.com\n🌐 Sayt: shahzodstudio.com',
    servicesText: '🛠 **Xizmatlarimiz:**\n\n🌐 Landing Page\n🏢 Business Website\n🛒 E-commerce\n🤖 AI Website\n📱 Telegram Mini App\n🤖 Telegram Bot\n⚙️ Web App\n📊 Admin Panel\n🔥 Custom Project\n\nTafsilotlar Mini Appda!',
  },
  en: {
    welcome:
      '🚀 Welcome to **Shahzod Web Studio**, {name}! 👋\n\nWe create modern websites, Telegram Mini Apps and digital solutions for business.\n\nChoose an action:',
    openApp: '🚀 Open the app',
    lang: '🌐 Language',
    services: '💼 Services',
    contact: '📞 Contact us',
    order: '🚀 Order a website',
    calc: '💰 Calculate price',
    portfolio: '🎨 Portfolio',
    myOrders: '📦 My orders',
    ai: '🤖 AI consultant',
    profile: '👤 Profile',
    appMsg:
      '🚀 Opening **Shahzod Web Studio**…\n\nTap the button below to launch the app right inside Telegram:',
    helpText:
      '❓ **Help — Shahzod Web Studio**\n\nWe build modern websites, Telegram bots and Mini Apps.\n\n🚀 Open the app: /app\n💼 Services: /services\n🎨 Portfolio: /portfolio\n📦 My orders: /orders\n👤 Profile: /profile\n\n📋 Main menu: /start\n\n💬 Telegram: @shahzodwebstudio\n📧 Email: hello@shahzodstudio.com',
    chooseLang: '🌐 Choose language:',
    contactText:
      '📞 **Contact us**\n\nWrite to us — we are available 24/7.\n\n💬 Telegram: @shahzodwebstudio\n📧 Email: hello@shahzodstudio.com\n🌐 Site: shahzodstudio.com',
    servicesText: '🛠 **Our services:**\n\n🌐 Landing Page\n🏢 Business Website\n🛒 E-commerce\n🤖 AI Website\n📱 Telegram Mini App\n🤖 Telegram Bot\n⚙️ Web App\n📊 Admin Panel\n🔥 Custom Project\n\nMore details in Mini App!',
  },
};

export class StudioBot {
  private bot: TelegramBot | null = null;
  private userLang = new Map<number, Lang>();

  constructor(private token = config.telegramBotToken) {}

  get isStarted(): boolean {
    return !!this.bot;
  }

  private t(id: number, key: keyof (typeof LANG)['ru']): string {
    return LANG[this.getLang(id)][key];
  }

  getLang(id: number): Lang {
    return this.userLang.get(id) || 'ru';
  }

  async start(): Promise<void> {
    if (!this.token) {
      console.warn('[bot] TELEGRAM_BOT_TOKEN not set. Bot disabled.');
      return;
    }
    this.bot = new TelegramBot(this.token, { polling: false });

    this.register();

    // Guard errors so silent polling failures are visible.
    this.bot.on('error', (e: any) => {
      console.error('[bot] error:', e?.message || String(e));
    });
    this.bot.on('polling_error', (e: any) => {
      console.warn('[bot] polling_error:', e?.message || String(e));
    });
    this.bot.on('webhook_error', (e: any) => {
      console.warn('[bot] webhook_error:', e?.message || String(e));
    });

    // Remove any stale webhook so long-polling receives updates.
    try {
      await this.bot.deleteWebHook().catch(() => {});
    } catch {
      /* ignore */
    }

    await this.bot.startPolling();

    await this.applyProfile();

    try {
      const me = await this.bot.getMe();
      console.log(`[bot] Telegram bot started (polling) as @${me.username}.`);
    } catch (e) {
      console.log('[bot] Telegram bot started (polling).');
      console.warn(`[bot] getMe failed: ${(e as Error).message}`);
    }

    if (WEBAPP_URL && !/^https:\/\//i.test(WEBAPP_URL)) {
      console.warn(
        `[bot] MINI_APP_URL=${WEBAPP_URL} is NOT a public HTTPS URL. Telegram Mini App will not open with an http:// URL. ` +
          'Set MINI_APP_URL to a public HTTPS URL (e.g. https://app.yourdomain.com) for production.',
      );
    }
  }

  private appUrl(path = '/'): string {
    return `${WEBAPP_URL}${path.startsWith('/') ? path : '/' + path}`;
  }

  private register(): void {
    const bot = this.bot!;

    bot.onText(/^\/(start|menu)$/, (msg) => {
      this.onStart(msg);
    });

    bot.on('callback_query', (query) => {
      if (!query.message) return;
      const chatId = query.message.chat.id;
      const data = query.data || '';
      const msg = query.message;
      if (data === 'lang_ru' || data === 'lang_uz' || data === 'lang_en') {
        const lang = data.split('_')[1] as Lang;
        this.userLang.set(chatId, lang);
        this.persistLanguage(chatId, lang);
        bot.answerCallbackQuery(query.id).catch(() => {});
        this.showMainMenu(chatId, msg.from?.first_name || '');
      } else if (data === 'language') {
        bot.answerCallbackQuery(query.id).catch(() => {});
        this.showLanguage(chatId);
      } else if (data === 'services') {
        bot.answerCallbackQuery(query.id).catch(() => {});
        bot.sendMessage(chatId, this.t(chatId, 'servicesText'), { reply_markup: { inline_keyboard: [[{ text: this.t(chatId, 'openApp'), web_app: { url: this.appUrl('/services') } }]] } }).catch(() => {});
      } else if (data === 'contact') {
        bot.answerCallbackQuery(query.id).catch(() => {});
        bot.sendMessage(chatId, this.t(chatId, 'contactText')).catch(() => {});
      } else {
        bot.answerCallbackQuery(query.id).catch(() => {});
      }
    });

    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;
      if (!text) return;
      const trimmed = text.trim();

      if (/^\/[a-z]+$/i.test(trimmed)) console.log(`[bot] command: ${trimmed}`);

      if (trimmed === '/app') return this.openAppPrompt(chatId, '/');
      if (trimmed === '/services') return this.openServices(chatId);
      if (trimmed === '/portfolio') return this.openAppPrompt(chatId, '/portfolio');
      if (trimmed === '/orders') return this.openAppPrompt(chatId, '/orders');
      if (trimmed === '/profile') return this.openAppPrompt(chatId, '/profile');
      if (trimmed === '/help') return this.showHelp(chatId);
      if (trimmed === '/calc') return this.openAppPrompt(chatId, '/calc');
      if (/^\/(start|menu)$/.test(trimmed)) return;

      // Quick replies: menu labels in any language -> open the matching Mini App page.
      const pathByLabel: Record<string, string> = {};
      for (const l of Object.values(LANG)) {
        pathByLabel[l.openApp] = '/';
        pathByLabel[l.order] = '/calc';
        pathByLabel[l.calc] = '/calc';
        pathByLabel[l.services] = '/services';
        pathByLabel[l.portfolio] = '/portfolio';
        pathByLabel[l.myOrders] = '/orders';
        pathByLabel[l.ai] = '/ai';
        pathByLabel[l.profile] = '/profile';
      }
      const target = pathByLabel[trimmed];
      if (target) {
        if (target === '/services') return this.openServices(chatId);
        return this.openAppPrompt(chatId, target);
      }

      // contact / language labels -> main menu
      const labels = new Set<string>();
      for (const l of Object.values(LANG)) {
        labels.add(l.contact);
        labels.add(l.lang);
      }
      if (labels.has(trimmed)) {
        this.showMainMenu(chatId, msg.from?.first_name || '');
        return;
      }
    });
  }

  private async persistLanguage(telegramId: number, lang: Lang): Promise<void> {
    try {
      const existing = await db.findUserByTelegramId(String(telegramId));
      if (existing) {
        await db.findOrCreateUser({ telegramId: String(telegramId), firstName: existing.firstName, username: existing.username, language: lang });
      }
    } catch {}
  }

  private async onStart(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const from = msg.from;
    const firstName = from?.first_name || '';
    console.log('[bot] received /start');

    try {
      await db.findOrCreateUser({
        telegramId: String(msg.chat.id),
        username: from?.username || null,
        firstName,
        language: from?.language_code === 'uz' ? 'uz' : from?.language_code === 'en' ? 'en' : 'ru',
      });
    } catch (e) {
      console.warn('[bot] failed to save user on /start:', (e as Error).message);
    }

    this.showMainMenu(chatId, firstName);
  }

  private showMainMenu(chatId: number, firstName: string): void {
    const bot = this.bot!;
    const lang = this.getLang(chatId);
    const t = LANG[lang];

    const keyboard: TelegramBot.InlineKeyboardButton[][] = [
      [{ text: t.openApp, web_app: { url: this.appUrl('/') } }],
      [
        { text: t.order, web_app: { url: this.appUrl('/calc') } },
        { text: t.services, web_app: { url: this.appUrl('/services') } },
      ],
      [
        { text: t.portfolio, web_app: { url: this.appUrl('/portfolio') } },
        { text: t.myOrders, web_app: { url: this.appUrl('/orders') } },
      ],
      [
        { text: t.ai, web_app: { url: this.appUrl('/ai') } },
        { text: t.profile, web_app: { url: this.appUrl('/profile') } },
      ],
      [
        { text: t.contact, callback_data: 'contact' },
        { text: t.lang, callback_data: 'language' },
      ],
    ];

    bot
      .sendMessage(
        chatId,
        t.welcome.replace('{name}', firstName || 'friend'),
        {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: keyboard },
        },
      )
      .catch((e: Error) => {
        console.warn(`[bot] failed to send main menu: ${e.message}`);
      });
  }

  private showLanguage(chatId: number): void {
    const bot = this.bot!;
    const keyboard: TelegramBot.InlineKeyboardButton[][] = [
      [{ text: '🇷🇺 Русский', callback_data: 'lang_ru' }],
      [{ text: '🇺🇿 O‘zbek', callback_data: 'lang_uz' }],
      [{ text: '🇬🇧 English', callback_data: 'lang_en' }],
    ];
    bot
      .sendMessage(chatId, this.t(chatId, 'chooseLang'), {
        reply_markup: { inline_keyboard: keyboard },
      })
      .catch(() => {});
  }

  /** Send the "open the Mini App" prompt with a web_app button. */
  private openAppPrompt(chatId: number, path: string): void {
    const bot = this.bot!;
    bot
      .sendMessage(chatId, this.t(chatId, 'appMsg'), {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: this.t(chatId, 'openApp'), web_app: { url: this.appUrl(path) } }]] },
      })
      .catch(() => {});
  }

  private openServices(chatId: number): void {
    const bot = this.bot!;
    bot
      .sendMessage(chatId, this.t(chatId, 'servicesText'), {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: this.t(chatId, 'openApp'), web_app: { url: this.appUrl('/services') } }]] },
      })
      .catch(() => {});
  }

  private showHelp(chatId: number): void {
    const bot = this.bot!;
    bot.sendMessage(chatId, this.t(chatId, 'helpText'), { parse_mode: 'Markdown' }).catch(() => {});
  }

  /** Set the bot profile: name, descriptions, command menu and the Mini App menu button. */
  private async applyProfile(): Promise<void> {
    const bot = this.bot!;
    const safe = (p: Promise<unknown>, label: string): Promise<void> =>
      p
        .then(() => console.log(`[bot] ${label}: ok`))
        .catch((e: any) => console.warn(`[bot] ${label}: ${e?.message || String(e)}`));

    await safe(bot.setMyName({ name: 'Shahzod Web Studio 🚀' }), 'setMyName');
    await safe(
      bot.setMyDescription({
        description:
          'Современные сайты, Telegram Mini Apps и цифровые решения для бизнеса. Готовые проекты, личный кабинет заказов, AI-консультант и онлайн-калькулятор стоимости.',
      }),
      'setMyDescription',
    );
    await safe(
      bot.setMyShortDescription({
        short_description: 'Создаём современные сайты, Telegram Mini Apps и цифровые решения для бизнеса.',
      }),
      'setMyShortDescription',
    );

    const commands: TelegramBot.BotCommand[] = [
      { command: 'start', description: '🚀 Запустить / главное меню' },
      { command: 'app', description: '🚀 Открыть приложение' },
      { command: 'services', description: '💼 Наши услуги' },
      { command: 'portfolio', description: '🎨 Портфолио проектов' },
      { command: 'orders', description: '📦 Мои заказы' },
      { command: 'profile', description: '👤 Профиль' },
      { command: 'help', description: '❓ Помощь' },
    ];
    await safe(bot.setMyCommands(commands), 'setMyCommands');

    const menuButton: TelegramBot.MenuButton = {
  type: 'web_app',
  text: '🚀 Открыть приложение',
  web_app: { url: WEBAPP_URL && /^https?:\/\//i.test(WEBAPP_URL) ? WEBAPP_URL : 'https://example.com' },
};
    await safe(bot.setChatMenuButton({ menu_button: menuButton }), 'setChatMenuButton(web_app default)');
    if (config.telegramAdminId) {
      await safe(
        bot.setChatMenuButton({ chat_id: Number(config.telegramAdminId), menu_button: menuButton }),
        'setChatMenuButton(web_app admin chat)',
      );
    }
  }

  /** Send a new order notification to the admin. */
  async notifyAdminNewOrder(order: Order, client: BotUser): Promise<void> {
    if (!this.bot || !config.telegramAdminId) return;

    // Telegram rejects inline-keyboard URL buttons that are not https://, t.me or tg://.
    function urlButton(text: string, url: string): TelegramBot.InlineKeyboardButton | null {
      if (/^https:\/\//i.test(url) || /^t\.me\//i.test(url) || /^tg:\/\//i.test(url)) {
        return { text, url };
      }
      return null;
    }

    const buttons: TelegramBot.InlineKeyboardButton[] = [];
    const openBtn = urlButton('📦 Открыть заявку', `${config.adminUrl}?open=orders`);
    if (openBtn) buttons.push(openBtn);
    if (client.telegramId) {
      const contactBtn = urlButton('💬 Связаться с клиентом', `tg://user?id=${client.telegramId}`);
      if (contactBtn) buttons.push(contactBtn);
    }
    const statusBtn = urlButton('🔄 Изменить статус', `${config.adminUrl}?open=orders&id=${order.id}`);
    if (statusBtn) buttons.push(statusBtn);

    const keyboard: TelegramBot.InlineKeyboardButton[][] = buttons.length ? [buttons] : [];
    const price = order.price != null ? `$${order.price}` : (order.budget != null ? `$${order.budget}` : '—');
    const text = [
      '🆕 **Новая заявка**',
      '',
      `#${order.orderNumber}`,
      `👤 Клиент: ${client.firstName}`,
      `📱 Telegram: @${client.username || '—'}`,
      `💼 Проект: ${order.service}`,
      `💰 Бюджет: ${price}`,
      `📝 Описание: ${order.description}`,
    ].join('\n');

    try {
      await this.bot.sendMessage(config.telegramAdminId, text, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard },
      });
    } catch (e) {
      console.warn('[bot] Failed to notify admin:', (e as Error).message);
    }
  }

  /** Notify a user when their order status changes (only on a real transition). */
  async notifyUserOrderStatus(telegramId: string, order: Order): Promise<void> {
    if (!this.bot || !telegramId) return;
    const n = `#${order.orderNumber}`;
    let text: string;
    switch (order.status) {
      case 'На рассмотрении':
        text = `🔄 **Обновление заказа ${n}**\n\nВаш заказ принят на рассмотрение.\n\nТекущий статус: *На рассмотрении*`;
        break;
      case 'В работе':
        text = `🚀 **Заказ ${n} перешёл в работу!**\n\nСтатус: *В работе*`;
        break;
      case 'Проверка':
        text = `🔍 **Заказ ${n}**\n\nПроект готов и отправлен на проверку.\n\nСтатус: *Проверка*`;
        break;
      case 'Завершён':
        text = `🎉 **Заказ ${n} завершён!**\n\nСпасибо за заказ в Shahzod Web Studio.`;
        break;
      case 'Отменён':
        text = `✖️ **Заказ ${n} отменён**\n\nСвяжитесь с нами, если хотите изменить решение.`;
        break;
      default:
        text = `📦 **Обновление заказа ${n}**\n\nСтатус: *${order.status}*`;
    }
    try {
      await this.bot.sendMessage(Number(telegramId), text, { parse_mode: 'Markdown' });
    } catch (e) {
      console.warn('[bot] Failed to notify user:', (e as Error).message);
    }
  }

  /** Notify a user that their order was successfully created. */
  async notifyOrderCreated(telegramId: string, order: Order): Promise<void> {
    if (!this.bot || !telegramId) return;
    const text = [
      `✅ **Ваш заказ #${order.orderNumber} успешно создан!**`,
      '',
      `📦 Статус: *Новый*`,
      '',
      'Мы получили вашу заявку и скоро начнём её рассмотрение.',
    ].join('\n');
    try {
      await this.bot.sendMessage(Number(telegramId), text, { parse_mode: 'Markdown' });
    } catch (e) {
      console.warn('[bot] Failed to notify order created:', (e as Error).message);
    }
  }

  /** Send a direct message from the studio to a client. */
  async sendDirectMessage(telegramId: string, text: string): Promise<void> {
    if (!this.bot) return;
    try {
      await this.bot.sendMessage(Number(telegramId), text, { parse_mode: 'Markdown' });
    } catch (e) {
      console.warn('[bot] Failed to send direct message:', (e as Error).message);
    }
  }
}

export const bot = new StudioBot();