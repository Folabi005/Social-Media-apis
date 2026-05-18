const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const signToken = (user) =>
  jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );

const sanitizeUser = (user) => {
  const { password, ...other } = user._doc;
  return other;
};

router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, profilePicture } = req.body;
    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email or username already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      profilePicture: profilePicture || "",
    });

    const savedUser = await newUser.save();
    const token = signToken(savedUser);

    res.status(201).json({ user: sanitizeUser(savedUser), token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = signToken(user);
    res.status(200).json({ user: sanitizeUser(user), token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
