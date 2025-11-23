import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('msg.db');

// 1. Khởi tạo bảng
export const initDB = () => {
  try {
    // Mẹo: Nếu muốn reset db lúc dev thì bỏ comment dòng dưới
    // db.execSync('DROP TABLE IF EXISTS messages;'); 

    db.execSync(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        messageId TEXT UNIQUE NOT NULL,  -- 👈 QUAN TRỌNG: Đã thêm UNIQUE
        chatId TEXT NOT NULL,
        content TEXT NOT NULL,
        sender TEXT NOT NULL,
        type TEXT DEFAULT 'text',
        timestamp INTEGER NOT NULL,
        status TEXT DEFAULT 'sent'
      );
    `);
    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
  }
};

// 2. Hàm lưu tin nhắn
export const saveMessageToDB = (arg1: any, arg2?: string, arg3?: string) => {
  try {
    let messageId, chatId, content, sender, type, timestamp;

    // Xử lý 2 kiểu gọi hàm
    if (typeof arg1 === 'object') {
      const msg = arg1;
      // Ưu tiên dùng messageId từ server, nếu không có mới tự tạo
      messageId = msg.messageId || Date.now().toString(); 
      chatId = msg.chatId;
      content = msg.content;
      sender = msg.sender;
      type = msg.type || 'text';
      timestamp = msg.timestamp || Date.now();
    } else {
      messageId = Date.now().toString() + Math.random().toString().slice(2, 5); 
      chatId = arg1;
      content = arg2;
      sender = arg3;
      type = 'text';
      timestamp = Date.now();
    }

    if (!chatId || !content || !sender) {
      console.error("❌ Thiếu dữ liệu khi lưu tin nhắn:", { chatId, content, sender });
      return;
    }

    // INSERT OR IGNORE sẽ hoạt động đúng nhờ 'messageId TEXT UNIQUE' ở trên
    db.runSync(
      `INSERT OR IGNORE INTO messages (messageId, chatId, content, sender, type, timestamp, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [messageId, chatId, content, sender, type, timestamp, 'sent']
    );

  } catch (error) {
    console.error("❌ Lỗi saveMessageToDB:", error);
  }
};

export const updateMessageStatus = (messageId: string, status: string) => {
  try {
    db.runSync(
      'UPDATE messages SET status = ? WHERE messageId = ?',
      [status, messageId]
    );
  } catch (error) {
    console.error("Lỗi update status:", error);
  }
};

// 3. Lấy danh sách tin nhắn chi tiết
export const getMessagesFromDB = (chatId: string) => {
  try {
    return db.getAllSync(
      'SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp ASC',
      [chatId]
    );
  } catch (e) { return []; }
};

// 4. Lấy Inbox (Tin nhắn cuối cùng)
export const getInboxConversations = () => {
  try {
    return db.getAllSync(`
      SELECT m.* FROM messages m
      INNER JOIN (
          SELECT chatId, MAX(timestamp) as max_time
          FROM messages
          GROUP BY chatId
      ) latest ON m.chatId = latest.chatId AND m.timestamp = latest.max_time
      ORDER BY m.timestamp DESC;
    `);
  } catch (error) {
    console.error("Lỗi lấy Inbox:", error);
    return [];
  }
};

// 5. Hàm Debug
export const debugCheckDB = () => {
  try {
    const rows = db.getAllSync('SELECT * FROM messages');
    console.log("🔍 DỮ LIỆU:", JSON.stringify(rows, null, 2));
    return rows;
  } catch (error) {
    console.error("❌ Lỗi đọc DB:", error);
    return [];
  }
};

// Đánh dấu tất cả tin nhắn của chatId đó là "seen"
export const markMessagesAsSeen = (chatId: string) => {
  try {
    db.runSync(
      `UPDATE messages SET status = 'seen' WHERE chatId = ? AND status = 'received'`,
      [chatId]
    );
    console.log(`✅ Đã đánh dấu đã đọc cho chat: ${chatId}`);
  } catch (error) {
    console.error("Lỗi markMessagesAsSeen:", error);
  }
};