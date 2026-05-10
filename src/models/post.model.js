const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  tags: [String],
  state: { type: String, enum: ["draft", "published"], default: "draft" },
  like_count: { type: Number, default: 0 },
  comment_count: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);