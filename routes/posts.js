const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const { verifyToken, tryVerifyToken } = require("../middleware/verifyToken");

router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const newPost = new Post({
      title,
      content,
      userId: req.user.id,
      tags: Array.isArray(tags)
        ? tags.map((tag) => tag.trim()).filter(Boolean)
        : typeof tags === "string"
        ? tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [],
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can update only your post" });
    }

    const updateData = { ...req.body };
    if (updateData.tags) {
      updateData.tags = Array.isArray(updateData.tags)
        ? updateData.tags.map((tag) => tag.trim()).filter(Boolean)
        : typeof updateData.tags === "string"
        ? updateData.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [];
    }
    if (updateData.state === "published" && post.state !== "published") {
      updateData.publishedAt = new Date();
    }

    const updated = await Post.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can delete only your post" });
    }
    await post.deleteOne();
    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id/like", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = req.user.id;
    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
      post.likeCount = post.likes.length;
      await post.save();
      return res.status(200).json({ message: "Post liked" });
    }

    post.likes = post.likes.filter((id) => id.toString() !== userId);
    post.likeCount = post.likes.length;
    await post.save();
    res.status(200).json({ message: "Post unliked" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const searchTitle = req.query.title;
    const searchAuthor = req.query.author;
    const searchTags = req.query.tags;
    const sortBy = req.query.sort || "timestamp";
    const order = req.query.order === "asc" ? 1 : -1;

    const filter = { state: "published" };
    if (searchTitle) {
      filter.title = { $regex: searchTitle, $options: "i" };
    }
    if (searchTags) {
      const tags = searchTags.split(",").map((tag) => tag.trim()).filter(Boolean);
      if (tags.length) {
        filter.tags = { $in: tags };
      }
    }
    if (searchAuthor) {
      const author = await User.findOne({
        $or: [
          { username: searchAuthor },
          { email: searchAuthor.toLowerCase() },
          { firstName: { $regex: searchAuthor, $options: "i" } },
          { lastName: { $regex: searchAuthor, $options: "i" } },
        ],
      });
      if (!author) {
        return res.status(200).json({ total: 0, page, limit, posts: [] });
      }
      filter.userId = author._id;
    }

    const sortMap = {
      like_count: "likeCount",
      comment_count: "commentCount",
      timestamp: "createdAt",
    };
    const sortField = sortMap[sortBy] || "createdAt";

    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .sort({ [sortField]: order })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "firstName lastName username profilePicture");

    const result = posts.map((post) => {
      const item = post.toObject();
      item.author = item.userId;
      delete item.userId;
      return item;
    });

    res.status(200).json({ total, page, limit, posts: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/timeline", verifyToken, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const followIds = user.followings.concat(user._id);
    const filter = { userId: { $in: followIds }, state: "published" };
    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "firstName lastName username profilePicture");

    const result = posts.map((post) => {
      const item = post.toObject();
      item.author = item.userId;
      delete item.userId;
      return item;
    });

    res.status(200).json({ total, page, limit, posts: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/mine", verifyToken, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const state = req.query.state;
    const filter = { userId: req.user.id };
    if (state) {
      filter.state = state;
    }
    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({ total, page, limit, posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function fetchTimeline(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const followIds = user.followings.concat(user._id);
    const filter = { userId: { $in: followIds }, state: "published" };
    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "firstName lastName username profilePicture");

    const result = posts.map((post) => {
      const item = post.toObject();
      item.author = item.userId;
      delete item.userId;
      return item;
    });

    res.status(200).json({ total, page, limit, posts: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

router.get("/timeline/all", verifyToken, fetchTimeline);

router.get("/:id", tryVerifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "userId",
      "firstName lastName username profilePicture"
    );
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.state !== "published") {
      if (!req.user || req.user.id !== post.userId._id.toString()) {
        return res.status(403).json({ message: "Post is not published" });
      }
    }
    const result = post.toObject();
    result.author = result.userId;
    delete result.userId;
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;