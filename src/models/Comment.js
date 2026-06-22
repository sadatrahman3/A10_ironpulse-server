import { Schema, model } from "mongoose";

const commentSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: "ForumPost", required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userImage: { type: String, default: "" },
    content: { type: String, required: true },
    parentCommentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
  },
  { timestamps: true }
);

export const Comment = model("Comment", commentSchema);
