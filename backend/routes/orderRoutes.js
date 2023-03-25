const express = require('express');
const { getOrders, createOrder, getOrder, updateOrder, deleteOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router()

router.route("/")
    .get(protect, getOrders)
    .post(protect, createOrder)
router.route("/:id")
    .get(protect, getOrder)
    .put(protect, updateOrder)
    .delete(protect, deleteOrder)
module.exports = router