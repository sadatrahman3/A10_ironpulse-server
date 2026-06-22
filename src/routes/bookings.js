import { Router } from "express";
import { Booking } from "../models/Booking.js";
import { Class } from "../models/Class.js";
import { verifyToken, checkNotBlocked } from "../middleware/auth.js";

const router = Router();

router.get("/check/:classId", verifyToken, async (req, res, next) => {
  try {
    const existing = await Booking.findOne({
      userId: req.user.id,
      classId: req.params.classId,
    });
    res.json({ hasBooked: !!existing });
  } catch (error) {
    next(error);
  }
});

router.get("/user", verifyToken, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

router.get("/trainer", verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== "trainer") {
      return res.status(403).json({ message: "Trainer access required" });
    }
    const bookings = await Booking.find({ trainerId: req.user.id }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

router.get("/class/:classId/students", verifyToken, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ classId: req.params.classId }).select("userId userName userEmail");
    const uniqueStudents = bookings.map((b) => ({
      userId: b.userId,
      userName: b.userName,
      userEmail: b.userEmail,
    }));
    const unique = [...new Map(uniqueStudents.map((s) => [s.userId, s])).values()];
    res.json(unique);
  } catch (error) {
    next(error);
  }
});

router.post("/", verifyToken, checkNotBlocked, async (req, res, next) => {
  try {
    const { classId, transactionId, amount } = req.body;

    const existing = await Booking.findOne({
      userId: req.user.id,
      classId,
    });

    if (existing) {
      return res.status(409).json({ message: "You have already booked this class" });
    }

    const fitnessClass = await Class.findById(classId);
    if (!fitnessClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    const booking = new Booking({
      userId: req.user.id,
      classId,
      trainerId: fitnessClass.trainerId,
      className: fitnessClass.name,
      trainerName: fitnessClass.trainerName,
      schedule: fitnessClass.schedule,
      amount,
      transactionId,
    });

    await booking.save();

    await Class.findByIdAndUpdate(classId, { $inc: { bookingCount: 1 } });

    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
});

export default router;
