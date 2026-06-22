import { Schema, model } from "mongoose";

const voteSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: "ForumPost", required: true },
    userId: { type: String, required: true },
    type: { type: String, enum: ["like", "dislike"], required: true },
  },
  { timestamps: true }
);

voteSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const Vote = model("Vote", voteSchema);
