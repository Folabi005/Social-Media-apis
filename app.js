require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const authRoute = require("./routes/auth");
const postsRoute = require("./routes/posts");
const usersRoute = require("./routes/users");

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "client")));

app.use("/auth", authRoute);
app.use("/posts", postsRoute);
app.use("/users", usersRoute);

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error(err);
  });

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;