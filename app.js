require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const PORT = process.env.PORT

const app = express()

app.use(express.json())

mongoose.connect(process.env.MONGO_URL)
.then(() => {
  console.log("MongoDB connected");
})
.catch((err) => {
  console.log(err);
});

app.get("/", (req, res) => {
  res.send("Welcome Home!")
})


app.listen(PORT, () => {
    console.log("Backend server is running!");
});