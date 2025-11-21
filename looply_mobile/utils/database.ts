// app/utils/database.ts
import * as SQLite from 'expo-sqlite';

// Mở database (nếu chưa có nó sẽ tự tạo file msg.db trong máy)
const db = SQLite.openDatabaseSync('msg.db'); 

// 1. Khởi tạo bảng (Chạy cái này 1 lần lúc mở app hoặc mở màn hình chat)
export const initDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chatId TEXT NOT NULL, -- Để phân biệt đang chat với ai (id user kia)
      content TEXT NOT NULL,
      sender TEXT NOT NULL, -- 'me' hoặc 'other'
      timestamp INTEGER NOT NULL
    );
  `);
};

// 2. Lưu tin nhắn mới
export const saveMessageToDB = (chatId: string, content: string, sender: 'me' | 'other') => {
  db.runSync(
    'INSERT INTO messages (chatId, content, sender, timestamp) VALUES (?, ?, ?, ?)',
    [chatId, content, sender, Date.now()]
  );
};

// 3. Lấy danh sách tin nhắn theo chatId
export const getMessagesFromDB = (chatId: string) => {
  const rows = db.getAllSync(
    'SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp ASC',
    [chatId]
  );
  return rows;
};