require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/database");
const seedUsers = require("./config/seedUsers");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

// Routes
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const userRoutes = require("./routes/user.routes");
const instructorRoutes = require("./routes/instructor.routes");
const paymentRoutes = require("./routes/payment.routes");
const candidateRoutes = require("./routes/candidate.routes");
const carRoutes = require("./routes/car.routes");
const packageRoutes = require("./routes/package.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const notificationRoutes = require("./routes/notification.routes");
const exportRoutes = require("./routes/export.routes");
const documentRoutes = require("./routes/document.routes");
const path = require("path");

const app = express();

connectDB();
mongoose.connection.once("open", () => {
  seedUsers().catch((err) => {
    // Don't log error details in production
    if (process.env.NODE_ENV === 'development') {
      console.error("Seed users error:", err);
    }
  });
});

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5174",
      "http://128.140.121.69",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Logging middleware for debugging (disabled in production for security)
app.use((req, res, next) => {
  // Don't log sensitive request data in production
  if (process.env.NODE_ENV === 'development' && req.path === "/api/auth/login") {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

app.get("/", (req, res) => {
  res.json({
    message: "AutoShkolla API is running!",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/instructors", instructorRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/documents", documentRoutes);

// 404 + errors
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Skip listen when run under iisnode (IIS sets this)
if (!process.env.IISNODE_VERSION) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

module.exports = app;
