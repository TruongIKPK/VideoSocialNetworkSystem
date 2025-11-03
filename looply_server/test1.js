import { io } from "socket.io-client";
const socket = io("http://localhost:5000");

const conversationId = "68fbd1f44086f78a75aaeeeb";
const userId = "68ef0a4bf472331c70e5f3e5";

socket.on("connect", () => {
  console.log("User1 connected");
  socket.emit("join-conversation", conversationId);

  // Gửi tin nhắn sau 2 giây
  setTimeout(() => {
    socket.emit("send-message", {
      conversationId,
      sender: userId,
      text: "Xin chào từ User1"
    });
  }, 2000);
});

socket.on("receive-message", (data) => {
  console.log("User1 nhận tin nhắn:", data);
});