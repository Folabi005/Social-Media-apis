const Post = require("../models/post.model");

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.likes && post.likes.includes(req.user._id)) {
      return res.status(400).json({ message: "Already liked" });
    }

    post.likes = post.likes || [];
    post.likes.push(req.user._id);
    post.like_count = post.likes.length;
    await post.save();

    res.json({ message: "Post liked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};