import { Router } from "express";
import { Class } from "../models/Class.js";
import { verifyToken, requireRole, checkNotBlocked } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    const filter = { status: "approved" };

    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: "i" };
    }

    if (req.query.category) {
      const categories = req.query.category.split(",").filter(Boolean);
      if (categories.length > 0) {
        filter.category = { $in: categories };
      }
    }

    const total = await Class.countDocuments(filter);
    const classes = await Class.find(filter)
      .sort({ bookingCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      classes,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/featured", async (req, res, next) => {
  try {
    const classes = await Class.find({ status: "approved" })
      .sort({ bookingCount: -1 })
      .limit(6);
    res.json(classes);
  } catch (error) {
    next(error);
  }
});

router.get("/admin/all", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const classes = await Class.find().sort({ createdAt: -1 });
    res.json(classes);
  } catch (error) {
    next(error);
  }
});

router.get("/trainer/me", verifyToken, requireRole("trainer"), async (req, res, next) => {
  try {
    const classes = await Class.find({ trainerId: req.user.id }).sort({ createdAt: -1 });
    res.json(classes);
  } catch (error) {
    next(error);
  }
});

router.get("/trainer/:trainerId", verifyToken, requireRole("trainer"), async (req, res, next) => {
  try {
    const classes = await Class.find({ trainerId: req.user.id }).sort({ createdAt: -1 });
    res.json(classes);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const fitnessClass = await Class.findById(req.params.id);
    if (!fitnessClass) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.json(fitnessClass);
  } catch (error) {
    next(error);
  }
});

router.post("/", verifyToken, requireRole("trainer"), checkNotBlocked, async (req, res, next) => {
  try {
    const {
      name,
      image,
      category,
      difficulty,
      duration,
      schedule,
      price,
      description,
    } = req.body;

    if (!name || !image || !category || !difficulty || !duration || !schedule || !price || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const fitnessClass = new Class({
      name,
      image,
      category,
      difficulty,
      duration,
      schedule,
      price: parseFloat(price),
      description,
      trainerId: req.user.id,
      trainerName: req.user.name,
      trainerImage: req.user.image || "",
      status: "pending",
    });

    await fitnessClass.save();
    res.status(201).json(fitnessClass);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", verifyToken, requireRole("trainer"), async (req, res, next) => {
  try {
    const fitnessClass = await Class.findById(req.params.id);
    if (!fitnessClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (fitnessClass.trainerId !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own classes" });
    }

    const updated = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const fitnessClass = await Class.findById(req.params.id);
    if (!fitnessClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (fitnessClass.trainerId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this class" });
    }

    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: "Class deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await Class.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
