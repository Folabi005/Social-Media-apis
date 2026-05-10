const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { createPost, getPosts } = require("../controllers/post.controller");

router.post("/", auth, createPost);
router.get("/", getPosts);

module.exports = router;