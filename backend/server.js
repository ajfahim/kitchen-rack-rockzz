const express = require('express');
const dotenv = require("dotenv").config();
const colors = require('colors');
const { errorHandler } = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');
const port = process.env.PORT || 5000;

connectDB()

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.status(200).json({ msg: "Kudos 👋 from Kitchen Rack" })
})

// customer routes 
app.use("/api/customers", require("./routes/customerRoutes"))

app.use(errorHandler)

app.listen(port, () => console.log(`📡 Server started on port ${port}`.yellow.bold))