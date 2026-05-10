const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { likePost, unlikePost } = require("../controllers/like.controller");

router.post("/:postId", auth, likePost);
router.delete("/:postId", auth, unlikePost);

module.exports = router;