require ("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");

console.log(process.env.MONGO_URL);
mongoose.connect(process.env.MONGO_URL)
.then(() => {
    console.log("Connected to MongoDB");
})
.catch((err) => {
    console.log(err);
});

//middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));



app.listen(8000, () => {
    console.log("Backend server is running!");
});