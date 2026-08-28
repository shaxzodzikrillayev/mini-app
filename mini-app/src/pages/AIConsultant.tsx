import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { Button, Spinner } from '../components/ui';
import { toast } from '../store/toast';
import { haptic } from '../lib/telegram';
import { useTheme } from '../store/theme';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  failed?: boolean;
}

const QUICK_QUESTIONS = [
  'Какой сайт нужен для моего бизнеса?',
  'Сколько стоит Landing Page?',
  'Нужен ли мне Telegram-бот?',
  'Помогите выбрать услугу',
];

export default function AIConsultant() {
  const scheme = useTheme((s) => s.scheme);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      content:
        'Привет! Я AI-консультант Shahzod Web Studio 🤖\n\nРасскажите о вашем бизнесе и задаче — я помогу подобрать подходящую услугу. Уточню тип сайта, нужные функции, нужен ли Telegram/AI, ваш бюджет и сроки. В конце соберу резюме заявки.',
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [fallback, setFallback] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = async (text: string) => {
    const value = (text ?? '').trim();
    if (!value || typing) return;
    const userMsg: Msg = { role: 'user', content: value };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);
    setFallback(false);
    try {
      const history = [...messages, userMsg];
      const res = await api.post<{ reply: string; usedFallback: boolean }>('/ai/chat', { messages: history });
      setFallback(res.usedFallback);
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
      haptic('success');
    } catch (e: any) {
      const last = [...messages, userMsg];
      setMessages(last.map((m, i) => (i === last.length - 1 ? { ...m, failed: true } : m)));
      toast.error(e?.message || 'Не удалось получить ответ');
    } finally {
      setTyping(false);
    }
  };

  const sendSummary = async () => {
    setTyping(true);
    const summary =
      '📋 Резюме заявки от AI-консультанта:\n\n' +
      messages
        .filter((m) => m.role === 'assistant' || m.role === 'user')
        .slice(-10)
        .map((m) => `**${m.role === 'user' ? 'Клиент' : 'AI'}**: ${m.content}`)
        .join('\n\n');
    try {
      await api.post('/contact', { message: summary });
      toast.success('Резюме отправлено!', 'Менеджер скоро свяжется с вами');
      haptic('success');
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось отправить');
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className={`app-bg ${scheme === 'dark' ? 'dark' : ''} flex min-h-screen flex-col`}>
      <div className="px-4 pb-2 pt-6">
        <div className="mb-1 flex items-center justify-between">
          <h1 className="text-main text-xl font-bold">🤖 AI-консультант</h1>
          <button onClick={() => window.history.back()} className="btn-soft rounded-xl px-3 py-1.5 text-xs font-medium">
            ← Назад
          </button>
        </div>
        <p className="text-hint mt-1 text-sm">Помогу выбрать услугу под вашу задачу</p>
      </div>

      <div className="flex-1 space-y-3 px-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user' ? 'btn-primary' : 'card text-main'
              }`}
            >
              {m.content}
              {m.role === 'assistant' && fallback && i === messages.length - 1 && (
                <p className="text-hint mt-2 border-t border-current/10 pt-2 text-[10px]">
                  (Ответ сформирован базовым консультантом)
                </p>
              )}
              {m.role === 'user' && m.failed && (
                <div className="mt-2 border-t border-current/15 pt-2">
                  <p className="text-[11px] opacity-80">Не удалось получить ответ 😔</p>
                  <Button variant="soft" onClick={() => send(m.content)} className="mt-2 !px-3 !py-1.5 text-xs">
                    🔄 Повторить
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="card flex items-center gap-2 px-4 py-3 text-sm text-hint">
              <Spinner className="h-4 w-4" /> Печатает...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick questions */}
      {messages.length <= 2 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="btn-soft shrink-0 rounded-xl px-3 py-2 text-xs font-medium"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Send summary */}
      {messages.length > 3 && (
        <div className="px-4 py-2">
          <Button onClick={sendSummary} loading={typing} className="w-full">
            📋 Отправить резюме заявки в студию
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="card safe-bottom sticky bottom-0 mt-2 flex items-center gap-2 rounded-none border-x-0 border-b-0 px-3 py-2.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="Введите сообщение..."
          className="text-main card flex-1 rounded-xl border-0 px-3 py-2.5 text-sm outline-none"
        />
        <button
          onClick={() => send(input)}
          disabled={typing}
          className="btn-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg disabled:opacity-50"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
