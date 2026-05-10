const express = require("express");
require("dotenv").config();

const PORT = process.env.PORT

const app = express()

app.use(express.json())


app.get("/", (req, res) => {
  res.send("Welcome Home!")
})


app.listen(PORT, ()=> {
    console.log(`Server started on PORT: http://localhost:${PORT}`)
})