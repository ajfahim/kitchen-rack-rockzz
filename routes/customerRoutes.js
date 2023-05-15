const express = require("express");
const router = express.Router();
const {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerControllers");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/userModel");
const { paginatedResults } = require("../middleware/pagination");

router
  .route("/")
  .get(protect, paginatedResults(User), getCustomers)
  .post(protect, paginatedResults(User), createCustomer);
router
  .route("/:id")
  .put(protect, paginatedResults(User), updateCustomer)
  .delete(protect, paginatedResults(User), deleteCustomer);

module.exports = router;
