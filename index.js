const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const colors = require("colors");

const { default: mongoose } = require("mongoose");
const Order = require("./models/orderModel");
const { errorHandler } = require("./middleware/errorMiddleware");
const connectDB = require("./config/db");
const moment = require("moment");
const { protect } = require("./middleware/authMiddleware");
const port = process.env.PORT || 5000;

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.status(200).json({ msg: "Kudos 👋 from Kitchen Rack" });
});

//routes
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/order-drafts", require("./routes/orderDraftRoutes"));

app.use(errorHandler);

app.listen(port, () =>
  console.log(`📡 Server started on port ${port}`.yellow.bold)
);
