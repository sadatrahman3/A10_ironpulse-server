import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import { connectDB } from "./config/db.js";
import { initAuth, getAuthInstance } from "./config/auth.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { requestLogger } from "./middleware/logger.js";

import authRoutes from "./routes/auth.js";
import classRoutes from "./routes/classes.js";
import bookingRoutes from "./routes/bookings.js";
import favoriteRoutes from "./routes/favorites.js";
import forumRoutes from "./routes/forum.js";
import commentRoutes from "./routes/comments.js";
import trainerAppRoutes from "./routes/trainerApplications.js";
import userRoutes from "./routes/users.js";
import transactionRoutes from "./routes/transactions.js";
import paymentRoutes from "./routes/payments.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.get("/", (req, res) => {
  res.json({ message: "IronPulse API is running", status: "ok" });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/trainer-applications", trainerAppRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/payments", paymentRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await initAuth();

    const auth = getAuthInstance();
    app.all("/api/better-auth/*", (req, res) => {
      const request = new Request(
        `${process.env.BETTER_AUTH_URL}${req.originalUrl}`,
        {
          method: req.method,
          headers: req.headers,
          body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
        }
      );
      auth.handler(request).then((response) => {
        res.status(response.status);
        response.headers.forEach((value, key) => {
          if (key.toLowerCase() !== "content-encoding") {
            res.setHeader(key, value);
          }
        });
        response.text().then((text) => res.send(text));
      });
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
