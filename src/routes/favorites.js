import { Router } from "express";
import { Favorite } from "../models/Favorite.js";
import { Class } from "../models/Class.js";
import { verifyToken, checkNotBlocked } from "../middleware/auth.js";

const router = Router();

router.get("/check/:classId", verifyToken, async (req, res, next) => {
  try {
    const existing = await Favorite.findOne({
      userId: req.user.id,
      classId: req.params.classId,
    });
    res.json({ isFavorite: !!existing });
  } catch (error) {
    next(error);
  }
});

router.get("/user", verifyToken, async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id });
    const classIds = favorites.map((f) => f.classId);
    const classes = await Class.find({ _id: { $in: classIds } });
    res.json(classes);
  } catch (error) {
    next(error);
  }
});

router.post("/", verifyToken, checkNotBlocked, async (req, res, next) => {
  try {
    const { classId } = req.body;

    const existing = await Favorite.findOne({
      userId: req.user.id,
      classId,
    });

    if (existing) {
      return res.status(409).json({ message: "Already in favorites" });
    }

    const favorite = new Favorite({ userId: req.user.id, classId });
    await favorite.save();

    res.status(201).json({ message: "Successfully added to your favorites!" });
  } catch (error) {
    next(error);
  }
});

router.delete("/:classId", verifyToken, async (req, res, next) => {
  try {
    await Favorite.findOneAndDelete({
      userId: req.user.id,
      classId: req.params.classId,
    });
    res.json({ message: "Removed from favorites" });
  } catch (error) {
    next(error);
  }
});

export default router;
