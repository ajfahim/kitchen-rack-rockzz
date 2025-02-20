const express = require("express");
const router = express.Router();
const {
  createOrderDraft,
  getOrderDrafts,
  getOrderDraft,
  updateOrderDraft,
  deleteOrderDraft,
} = require("../controllers/orderDraftController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").post(protect, createOrderDraft).get(protect, getOrderDrafts);
router
  .route("/:id")
  .get(protect, getOrderDraft)
  .put(protect, updateOrderDraft)
  .delete(protect, deleteOrderDraft);

module.exports = router;
