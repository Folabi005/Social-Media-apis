const Post = require("../models/post.model");

exports.createPost = async (req, res) => {
  try {
    const post = new Post({ ...req.body, author: req.user._id });
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, state, search, orderBy } = req.query;
    const query = { state: "published" };

    if (state) query.state = state;
    if (search) {
      query.$or = [
        { title: new RegExp(search, "i") },
        { tags: new RegExp(search, "i") }
      ];
    }

    let sort = {};
    if (orderBy) sort[orderBy] = -1;

    const posts = await Post.find(query)
      .populate("author", "username email")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};