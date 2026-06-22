import { Router } from "express";
import { getDb } from "../config/db.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const db = getDb();
    const users = await db
      .collection("user")
      .find({})
      .project({ password: 0 })
      .toArray();

    const formattedUsers = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      image: u.image,
      role: u.role || "user",
      status: u.status || "active",
      trainerApplicationStatus: u.trainerApplicationStatus || "none",
      createdAt: u.createdAt,
    }));

    res.json(formattedUsers);
  } catch (error) {
    next(error);
  }
});

router.get("/trainers", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const db = getDb();
    const trainers = await db
      .collection("user")
      .find({ role: "trainer" })
      .project({ password: 0 })
      .toArray();

    const formattedTrainers = trainers.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      image: u.image,
      role: u.role,
      status: u.status || "active",
      createdAt: u.createdAt,
    }));

    res.json(formattedTrainers);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["active", "blocked"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const db = getDb();
    const result = await db.collection("user").updateOne(
      { _id: req.params.id },
      { $set: { status } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: `User ${status === "blocked" ? "blocked" : "unblocked"} successfully` });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/role", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const db = getDb();
    const result = await db.collection("user").updateOne(
      { _id: req.params.id },
      { $set: { role } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: `User role updated to ${role}` });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/demote", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const db = getDb();
    const result = await db.collection("user").updateOne(
      { _id: req.params.id, role: "trainer" },
      {
        $set: {
          role: "user",
          trainerApplicationStatus: "none",
          trainerFeedback: "",
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Trainer not found" });
    }

    res.json({ message: "Trainer demoted to user successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;
