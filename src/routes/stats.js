import { Router } from "express";
import { Class } from "../models/Class.js";
import { Transaction } from "../models/Transaction.js";
import { Booking } from "../models/Booking.js";
import { getDb } from "../config/db.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/admin", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const db = getDb();
    const [totalUsers, totalClasses, totalBookings, totalTransactions] = await Promise.all([
      db.collection("user").countDocuments(),
      Class.countDocuments(),
      Booking.countDocuments(),
      Transaction.countDocuments(),
    ]);
    res.json({ totalUsers, totalClasses, totalBookings, totalTransactions });
  } catch (error) {
    next(error);
  }
});

export default router;
