const User = require("../models/User");
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { verifyToken } = require("../middleware/verifyToken");

router.put("/:id", verifyToken, async (req, res) => {
  if (req.user.id === req.params.id || req.user.isAdmin) {
    if (req.body.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      } catch (err) {
        return res.status(500).json({ message: err.message });
      }
    }
    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      ).select("-password");
      res.status(200).json(updatedUser);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  } else {
    return res.status(403).json({ message: "You can update only your account!" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  if (req.user.id === req.params.id || req.user.isAdmin) {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Account has been deleted" });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  } else {
    return res.status(403).json({ message: "You can delete only your account!" });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id/follow", verifyToken, async (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(403).json({ message: "You cannot follow yourself" });
  }
  try {
    const user = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);
    if (!user || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.followers.includes(req.user.id)) {
      return res.status(400).json({ message: "You already follow this user" });
    }

    user.followers.push(req.user.id);
    currentUser.followings.push(req.params.id);
    await user.save();
    await currentUser.save();

    res.status(200).json({ message: "User has been followed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id/unfollow", verifyToken, async (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(403).json({ message: "You cannot unfollow yourself" });
  }
  try {
    const user = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);
    if (!user || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.followers.includes(req.user.id)) {
      return res.status(400).json({ message: "You do not follow this user" });
    }

    user.followers = user.followers.filter((id) => id.toString() !== req.user.id);
    currentUser.followings = currentUser.followings.filter(
      (id) => id.toString() !== req.params.id
    );
    await user.save();
    await currentUser.save();

    res.status(200).json({ message: "User has been unfollowed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/me/followers", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "followers",
      "firstName lastName username profilePicture"
    );
    res.status(200).json({ total: user.followers.length, followers: user.followers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/me/followings", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "followings",
      "firstName lastName username profilePicture"
    );
    res.status(200).json({ total: user.followings.length, followings: user.followings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id/followers", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "followers",
      "firstName lastName username profilePicture"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ total: user.followers.length, followers: user.followers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id/followings", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "followings",
      "firstName lastName username profilePicture"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ total: user.followings.length, followings: user.followings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;