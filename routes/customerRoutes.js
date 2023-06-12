const express = require("express");
const router = express.Router();
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomerByName,
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
  .get(protect, getCustomer)
  .put(protect, paginatedResults(User), updateCustomer)
  .delete(protect, paginatedResults(User), deleteCustomer);
router.route("/by-name/:name").get(protect, searchCustomerByName);

module.exports = router;
