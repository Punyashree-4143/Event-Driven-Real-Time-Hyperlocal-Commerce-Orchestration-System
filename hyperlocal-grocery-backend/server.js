const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

// ROUTES
const authRoutes = require("./routes/auth");
const storeRoutes = require("./routes/storeRoutes");
const productRoutes = require("./routes/product");
const orderRoutes = require("./routes/order");
const adminRoutes = require("./routes/adminRoutes");
const deliveryRoutes = require("./routes/delivery");

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin))
        return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/delivery", deliveryRoutes);

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend running 🚀" });
});

// HTTP + SOCKET
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Make io available in controllers
app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // ORDER ROOM
  socket.on("joinOrder", (orderId) => {
    socket.join(orderId);
    console.log(`📦 Joined order room: ${orderId}`);
  });

  // STORE ROOM
  socket.on("joinStore", (storeId) => {
    socket.join(storeId);
    console.log(`🏪 Joined store room: ${storeId}`);
  });

  // 🚚 DELIVERY ROOM (NEW)
  socket.on("joinDelivery", () => {
    socket.join("delivery");
    console.log("🚚 Delivery joined delivery room");
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
