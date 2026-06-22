import { Router } from "express";
import { Comment } from "../models/Comment.js";
import { verifyToken, checkNotBlocked } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.get("/:postId", async (req, res, next) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId })
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    next(error);
  }
});

router.post("/:postId", verifyToken, checkNotBlocked, async (req, res, next) => {
  try {
    const { content, parentCommentId } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const comment = new Comment({
      postId: req.params.postId,
      userId: req.user.id,
      userName: req.user.name,
      userImage: req.user.image || "",
      content,
      parentCommentId: parentCommentId || null,
    });

    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
});

router.put("/:commentId", verifyToken, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.userId !== req.user.id) {
      return res.status(403).json({ message: "You can only edit your own comments" });
    }

    comment.content = req.body.content;
    await comment.save();
    res.json(comment);
  } catch (error) {
    next(error);
  }
});

router.delete("/:commentId", verifyToken, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    await Comment.findByIdAndDelete(req.params.commentId);
    await Comment.deleteMany({ parentCommentId: req.params.commentId });
    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;
