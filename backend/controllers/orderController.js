const asyncHandler = require("express-async-handler")

const Order = require("../models/orderModel")

//@desc     Get all Orders
//@route    GET /api/orders
//@access   Private
const getOrders = asyncHandler(async (req, res) => {

    const orders = await Order.find({});

    res.status(200).json(orders)
})

//@desc     Get a Order
//@route    GET /api/order/:id
//@access   Private
const getOrder = asyncHandler(async (req, res) => {

    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(400)
        throw new Error("Order not found")
    }

    res.status(200).json(order)
})

//@desc     Create order
//@route    POST /api/orders
//@access   Private
const createOrder = asyncHandler(async (req, res) => {

    if (!req.body) {
        res.status(400)
        throw new Error("No body received")
    }

    const order = await Order.create(req.body)
    res.status(200).json(order)
})

//@desc     Update Order
//@route    PUT /api/order/:id
//@access   Private
const updateOrder = asyncHandler(async (req, res) => {

    const order = await Order.findById(req.params.id);
    if (!order) {
        res.status(400)
        throw new Error("Order not found")
    }

    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    res.status(200).json(updatedOrder)
})

//@desc     Delete Order
//@route    DELETE /api/orders/:id
//@access   Private
const deleteOrder = asyncHandler(async (req, res) => {

    const order = await Order.findById(req.params.id);
    if (!order) {
        res.status(400);
        throw new Error("Order not found")
    }

    await order.remove()
    res.status(200).json({ id: req.params.id })
})

module.exports = {
    getOrders,
    getOrder,
    createOrder,
    updateOrder,
    deleteOrder,

}