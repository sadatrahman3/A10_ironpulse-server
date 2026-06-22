import { Router } from "express";
import { ForumPost } from "../models/ForumPost.js";
import { Vote } from "../models/Vote.js";
import { verifyToken, requireRole, checkNotBlocked } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const total = await ForumPost.countDocuments();
    const posts = await ForumPost.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const posts = await ForumPost.find({
      $or: [
        { title: { $regex: safe, $options: "i" } },
        { description: { $regex: safe, $options: "i" } },
      ],
    }).sort({ createdAt: -1 }).limit(10);
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

router.get("/latest", async (req, res, next) => {
  try {
    const posts = await ForumPost.find().sort({ createdAt: -1 }).limit(4);
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

router.get("/author/:authorId", verifyToken, async (req, res, next) => {
  try {
    const posts = await ForumPost.find({ authorId: req.params.authorId }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

router.get("/admin/all", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const posts = await ForumPost.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    next(error);
  }
});

router.post("/", verifyToken, requireRole("trainer", "admin"), checkNotBlocked, async (req, res, next) => {
  try {
    const { title, image, description } = req.body;

    if (!title || !image || !description) {
      return res.status(400).json({ message: "Title, image, and description are required" });
    }

    const post = new ForumPost({
      title,
      image,
      description,
      authorId: req.user.id,
      authorName: req.user.name,
      authorImage: req.user.image || "",
      authorRole: req.user.role,
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.authorId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    await ForumPost.findByIdAndDelete(req.params.id);
    await Vote.deleteMany({ postId: req.params.id });
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/vote", verifyToken, checkNotBlocked, async (req, res, next) => {
  try {
    const { type } = req.body;
    if (!["like", "dislike"].includes(type)) {
      return res.status(400).json({ message: "Invalid vote type" });
    }

    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const existingVote = await Vote.findOne({ postId: req.params.id, userId: req.user.id });

    if (existingVote) {
      if (existingVote.type === type) {
        await Vote.findByIdAndDelete(existingVote._id);
        if (type === "like") post.likeCount = Math.max(0, post.likeCount - 1);
        else post.dislikeCount = Math.max(0, post.dislikeCount - 1);
        await post.save();
        return res.json({ message: "Vote removed", post });
      } else {
        if (existingVote.type === "like") post.likeCount = Math.max(0, post.likeCount - 1);
        else post.dislikeCount = Math.max(0, post.dislikeCount - 1);

        existingVote.type = type;
        await existingVote.save();

        if (type === "like") post.likeCount += 1;
        else post.dislikeCount += 1;
        await post.save();
        return res.json({ message: "Vote updated", post });
      }
    }

    const vote = new Vote({ postId: req.params.id, userId: req.user.id, type });
    await vote.save();

    if (type === "like") post.likeCount += 1;
    else post.dislikeCount += 1;
    await post.save();

    res.json({ message: "Vote added", post });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/vote", verifyToken, async (req, res, next) => {
  try {
    const vote = await Vote.findOne({ postId: req.params.id, userId: req.user.id });
    res.json({ vote: vote ? vote.type : null });
  } catch (error) {
    next(error);
  }
});

export default router;
