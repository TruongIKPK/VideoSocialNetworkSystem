import { io } from "socket.io-client";
const socket = io("http://localhost:5000");

const conversationId = "68fbd1f44086f78a75aaeeeb"; // Trùng với test1.js
const userId = "681b5f006cbd16fb0224fa48"; // Thay bằng id thật

socket.on("connect", () => {
  console.log("User2 connected");
  socket.emit("join-conversation", conversationId);

  // Gửi tin nhắn sau 4 giây
  setTimeout(() => {
    socket.emit("send-message", {
      conversationId,
      sender: userId,
      text: "Chào lại từ User2"
    });
  }, 4000);
});

socket.on("receive-message", (data) => {
  console.log("User2 nhận tin nhắn:", data);
});