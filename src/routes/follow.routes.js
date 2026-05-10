const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { followUser, unfollowUser, getFollowing, getFollowers } = require("../controllers/follow.controller");

router.post("/:userId", auth, followUser);
router.delete("/:userId", auth, unfollowUser);
router.get("/following", auth, getFollowing);
router.get("/followers", auth, getFollowers);

module.exports = router;