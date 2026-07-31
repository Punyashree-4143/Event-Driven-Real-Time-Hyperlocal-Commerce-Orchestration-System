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
const catalogRoutes = require("./routes/catalogRoutes");

dotenv.config();
connectDB();

const app = express();

/* =====================
   MIDDLEWARE
   ===================== */
app.use(express.json());
app.use(cookieParser());

// ✅ OPEN CORS (TEMP for Render + Vercel)
app.use(
  cors({
    origin: true,       // allow all origins
    credentials: true,
  })
);

/* =====================
   API ROUTES
   ===================== */
app.use("/api/auth", authRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/catalog", catalogRoutes);

/* =====================
   HEALTH CHECK
   ===================== */
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend running 🚀" });
});

app.use("/api", (req, res) => {
  res.status(404).json({
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* =====================
   HTTP + SOCKET.IO
   ===================== */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",        // allow all socket origins
    credentials: true,
  },
});

// Make io available in controllers
app.set("io", io);

/* =====================
   SOCKET EVENTS
   ===================== */
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // 📦 ORDER ROOM
  socket.on("joinOrder", (orderId) => {
    socket.join(orderId);
    console.log(`📦 Joined order room: ${orderId}`);
  });

  // 🏪 STORE ROOM
  socket.on("joinStore", (storeId) => {
    socket.join(storeId);
    console.log(`🏪 Joined store room: ${storeId}`);
  });

  // 🚚 DELIVERY ROOM
  socket.on("joinDelivery", () => {
    socket.join("delivery");
    console.log("🚚 Delivery joined delivery room");
  });

  // 📍 RIDER LOCATION TRACKING
  socket.on("updateLocation", ({ orderId, lat, lng }) => {
    io.to(orderId).emit("locationUpdate", { lat, lng });
    console.log(`📍 Location update for order ${orderId}: lat=${lat}, lng=${lng}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

/* =====================
   SERVER START
   ===================== */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
