const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/auth");
const storeRoutes = require("./routes/storeRoutes");
const productRoutes = require("./routes/product");
const orderRoutes = require("./routes/order");
const adminRoutes = require("./routes/adminRoutes");

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:5173", // customer + admin
  "http://localhost:5174", // vendor
];

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "Backend running 🚀" });
});

// HTTP + SOCKET
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

// 🔥 expose io
app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // 👥 customers join store room
  socket.on("joinStore", (storeId) => {
    socket.join(storeId);
    console.log(`🏪 Joined store room: ${storeId}`);
  });

  // 📦 tracking room
  socket.on("joinOrder", (orderId) => {
    socket.join(orderId);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
