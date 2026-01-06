import Database from 'better-sqlite3';

let db: Database.Database | null = null;

export function getBotDb() {
  if (db) return db;

  const dbPath = process.env.BOT_SQLITE_PATH;
  if (!dbPath) {
    throw new Error('BOT_SQLITE_PATH не задан');
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // На всякий случай создадим таблицу tickets, если еще не создана.
  // Если у тебя бот уже создавал - просто ничего не произойдет.
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_chat_id INTEGER NOT NULL,
      user_label TEXT NOT NULL,
      status TEXT NOT NULL,
      assigned_manager_id INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_user_message_at INTEGER NOT NULL,
      last_notified_at INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_tickets_user_status
      ON tickets(user_chat_id, status, updated_at);
    CREATE INDEX IF NOT EXISTS idx_tickets_assignee_status
      ON tickets(assigned_manager_id, status, updated_at);
  `);

  return db;
}

export type TicketRow = {
  id: number;
  user_chat_id: number;
  user_label: string;
  status: string;
  assigned_manager_id: number | null;
  created_at: number;
  updated_at: number;
  last_user_message_at: number;
  last_notified_at: number;
};
