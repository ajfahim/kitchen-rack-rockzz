const express = require("express");
const {
  getOrders,
  createOrder,
  getOrder,
  updateOrder,
  deleteOrder,
  getOrderedProductByDate,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.route("/").get(protect, getOrders).post(protect, createOrder);
router
  .route("/:id")
  .get(protect, getOrder)
  .put(protect, updateOrder)
  .delete(protect, deleteOrder);

router.get("/products/orderedProductsToday", protect, getOrderedProductByDate);

module.exports = router;
