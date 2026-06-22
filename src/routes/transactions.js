import { Router } from "express";
import { Transaction } from "../models/Transaction.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

export default router;
