import { NextResponse } from 'next/server';
import { verifyWebAppInitData } from '@/lib/telegram/verifyWebAppInitData';
import { getBotDb, TicketRow } from '@/lib/botSqlite';

export const runtime = 'nodejs';

const SESSION_MS = 24 * 60 * 60 * 1000; // 24 часа
const STATUS_CLOSED = 'closed';
const STATUS_NEW = 'new';

function now() {
  return Date.now();
}

function safeJsonParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function formatClientLabel(user: any) {
  const first = (user?.first_name || '').trim();
  const last = (user?.last_name || '').trim();
  const full = `${first} ${last}`.trim() || 'Клиент';
  const username = user?.username ? `@${user.username}` : '';
  return username ? `${full} (${username})` : full;
}

async function tgSendMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_SUPPORT_BOT_TOKEN не задан');

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  }).catch(() => {});
}

function getManagerIds(): number[] {
  const raw = process.env.TELEGRAM_MANAGER_IDS || '';
  return raw
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((x) => Number.isFinite(x) && x > 0);
}

function summarizeData(data: any): string {
  if (!data || typeof data !== 'object') return '-';

  const allow = ['path', 'productId', 'productTitle', 'productUrl', 'category', 'note'];
  const parts: string[] = [];

  for (const k of allow) {
    if (data[k] === undefined || data[k] === null) continue;
    const v = String(data[k]).slice(0, 400);
    parts.push(`${k}: ${v}`);
  }

  return parts.length ? parts.join('\n') : '-';
}

function findActiveTicket(db: ReturnType<typeof getBotDb>, userChatId: number): TicketRow | null {
  const row = db
    .prepare(
      `
      SELECT * FROM tickets
      WHERE user_chat_id = ?
        AND status != ?
      ORDER BY updated_at DESC
      LIMIT 1
    `
    )
    .get(userChatId, STATUS_CLOSED) as TicketRow | undefined;

  if (!row) return null;
  if (now() - Number(row.last_user_message_at) > SESSION_MS) return null;
  return row;
}

function createTicket(db: ReturnType<typeof getBotDb>, userChatId: number, userLabel: string): TicketRow {
  const t = now();
  const res = db
    .prepare(
      `
      INSERT INTO tickets
        (user_chat_id, user_label, status, assigned_manager_id, created_at, updated_at, last_user_message_at, last_notified_at)
      VALUES
        (?, ?, ?, NULL, ?, ?, ?, 0)
    `
    )
    .run(userChatId, userLabel, STATUS_NEW, t, t, t);

  const ticket = db.prepare(`SELECT * FROM tickets WHERE id = ?`).get(res.lastInsertRowid) as TicketRow;
  return ticket;
}

function touchTicket(db: ReturnType<typeof getBotDb>, ticketId: number): TicketRow {
  const t = now();
  db.prepare(
    `
    UPDATE tickets
    SET updated_at = ?, last_user_message_at = ?
    WHERE id = ?
  `
  ).run(t, t, ticketId);

  return db.prepare(`SELECT * FROM tickets WHERE id = ?`).get(ticketId) as TicketRow;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 });

    const { initData, event, data } = body as {
      initData?: string;
      event?: string;
      data?: any;
    };

    const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN || '';
    const v = verifyWebAppInitData(initData || '', botToken);
    if (!v.ok) {
      return NextResponse.json({ ok: false, error: `initData invalid: ${v.error}` }, { status: 401 });
    }

    const user = safeJsonParse<any>(v.data.user || null);
    if (!user?.id) {
      return NextResponse.json({ ok: false, error: 'user.id not found in initData' }, { status: 400 });
    }

    const userChatId = Number(user.id); // в личке chat.id == user.id
    const userLabel = formatClientLabel(user);
    const managers = getManagerIds();

    const db = getBotDb();

    // создаем/находим заявку
    let ticket = findActiveTicket(db, userChatId);
    if (!ticket) ticket = createTicket(db, userChatId, userLabel);
    else ticket = touchTicket(db, ticket.id);

    const botUsername = process.env.SUPPORT_BOT_USERNAME ? `@${process.env.SUPPORT_BOT_USERNAME}` : 'ваш бот';

    const text =
`🟣 Mini App: ${String(event || 'event').slice(0, 80)}
Заявка #${ticket.id} - ${ticket.status}
Клиент: ${userLabel}

Данные:
${summarizeData(data)}

Ответить клиенту: откройте ${botUsername} и ответьте реплаем на заявку (или используйте /open, /my).`;

    // уведомляем менеджеров в личку
    await Promise.all(managers.map((mid) => tgSendMessage(mid, text)));

    return NextResponse.json({ ok: true, ticketId: ticket.id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'server error' },
      { status: 500 }
    );
  }
}
