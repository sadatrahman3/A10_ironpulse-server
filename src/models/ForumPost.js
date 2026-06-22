import { Schema, model } from "mongoose";

const forumPostSchema = new Schema(
  {
    title: { type: String, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    authorImage: { type: String, default: "" },
    authorRole: { type: String, enum: ["trainer", "admin"], required: true },
    likeCount: { type: Number, default: 0 },
    dislikeCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ForumPost = model("ForumPost", forumPostSchema);
