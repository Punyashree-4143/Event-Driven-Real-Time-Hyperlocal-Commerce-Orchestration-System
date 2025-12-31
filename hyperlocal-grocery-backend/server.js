const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const storeRoutes = require("./routes/storeRoutes");

const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

/* =========================
   Middleware
========================= */
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173", // Vite frontend
    credentials: true,
  })
);

/* =========================
   Routes
========================= */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/stores", require("./routes/storeRoutes")); // ✅ hyperlocal stores
app.use("/api/products", require("./routes/product"));
app.use("/api/orders", require("./routes/order"));

// later:
// app.use("/api/products", require("./routes/product"));
// app.use("/api/orders", require("./routes/order"));

/* =========================
   Health Check
========================= */
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend running 🚀" });
});

/* =========================
   Socket.IO Setup
========================= */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // Real-time stock update
  socket.on("updateStock", (data) => {
    io.emit("stockUpdated", data);
  });

  // Real-time delivery tracking
  socket.on("driverLocation", (coords) => {
    io.emit(`driver-${coords.orderId}`, coords);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

/* =========================
   Server Start
========================= */
const PORT = process.env.PORT || 5001;

server.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
