const OrderDraft = require("../models/orderDraftModel");
const asyncHandler = require("express-async-handler");

// @desc    Create new order draft
// @route   POST /api/order-drafts
// @access  Private
const createOrderDraft = asyncHandler(async (req, res) => {
  const { customerDetails, orderDetails, processingDate } = req.body;

  const orderDraft = await OrderDraft.create({
    customerDetails,
    orderDetails,
    processingDate,
  });

  res.status(201).json(orderDraft);
});

// @desc    Get all order drafts with date filter
// @route   GET /api/order-drafts
// @access  Private
const getOrderDrafts = asyncHandler(async (req, res) => {
  const { date, page = 1, limit = 10 } = req.query;

  const query = {};

  if (date) {
    const searchDate = new Date(date);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    query.processingDate = {
      $gte: searchDate,
      $lt: nextDay
    };
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
  };

  const orderDrafts = await OrderDraft.paginate(query, options);
  res.status(200).json(orderDrafts);
});

// @desc    Get single order draft
// @route   GET /api/order-drafts/:id
// @access  Private
const getOrderDraft = asyncHandler(async (req, res) => {
  const orderDraft = await OrderDraft.findById(req.params.id);

  if (!orderDraft) {
    res.status(404);
    throw new Error("Order draft not found");
  }

  res.status(200).json(orderDraft);
});

// @desc    Update order draft
// @route   PUT /api/order-drafts/:id
// @access  Private
const updateOrderDraft = asyncHandler(async (req, res) => {
  const orderDraft = await OrderDraft.findById(req.params.id);

  if (!orderDraft) {
    res.status(404);
    throw new Error("Order draft not found");
  }

  const updatedOrderDraft = await OrderDraft.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.status(200).json(updatedOrderDraft);
});

// @desc    Delete order draft
// @route   DELETE /api/order-drafts/:id
// @access  Private
const deleteOrderDraft = asyncHandler(async (req, res) => {
  const orderDraft = await OrderDraft.findById(req.params.id);

  if (!orderDraft) {
    res.status(404);
    throw new Error("Order draft not found");
  }

  await orderDraft.deleteOne();
  res.status(200).json({ id: req.params.id });
});

module.exports = {
  createOrderDraft,
  getOrderDrafts,
  getOrderDraft,
  updateOrderDraft,
  deleteOrderDraft,
};
