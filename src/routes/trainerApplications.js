import { Router } from "express";
import { TrainerApplication } from "../models/TrainerApplication.js";
import { getDb } from "../config/db.js";
import { verifyToken, requireRole, checkNotBlocked } from "../middleware/auth.js";

const router = Router();

router.get("/my", verifyToken, async (req, res, next) => {
  try {
    const application = await TrainerApplication.findOne({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(application);
  } catch (error) {
    next(error);
  }
});

router.get("/pending", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const applications = await TrainerApplication.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    next(error);
  }
});

router.post("/", verifyToken, checkNotBlocked, async (req, res, next) => {
  try {
    const { experience, specialty } = req.body;

    if (!experience || !specialty) {
      return res.status(400).json({ message: "Experience and specialty are required" });
    }

    const existing = await TrainerApplication.findOne({
      userId: req.user.id,
      status: "pending",
    });

    if (existing) {
      return res.status(409).json({ message: "You already have a pending application" });
    }

    const application = new TrainerApplication({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userImage: req.user.image || "",
      experience: parseInt(experience),
      specialty,
    });

    await application.save();

    const db = getDb();
    await db.collection("user").updateOne(
      { _id: req.user.id },
      { $set: { trainerApplicationStatus: "pending", trainerFeedback: "" } }
    );

    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/approve", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const application = await TrainerApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.status = "approved";
    if (req.body.feedback) application.feedback = req.body.feedback;
    await application.save();

    const db = getDb();
    await db.collection("user").updateOne(
      { _id: application.userId },
      {
        $set: {
          role: "trainer",
          trainerApplicationStatus: "approved",
          trainerFeedback: req.body.feedback || "",
        },
      }
    );

    res.json({ message: "Trainer application approved", application });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/reject", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { feedback } = req.body;
    if (!feedback) {
      return res.status(400).json({ message: "Feedback is required when rejecting" });
    }

    const application = await TrainerApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.status = "rejected";
    application.feedback = feedback;
    await application.save();

    const db = getDb();
    await db.collection("user").updateOne(
      { _id: application.userId },
      {
        $set: {
          trainerApplicationStatus: "rejected",
          trainerFeedback: feedback,
        },
      }
    );

    res.json({ message: "Trainer application rejected", application });
  } catch (error) {
    next(error);
  }
});

export default router;
