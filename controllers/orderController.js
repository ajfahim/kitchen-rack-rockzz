const asyncHandler = require("express-async-handler");

const Order = require("../models/orderModel");
const { Product, Variation } = require("../models/productModel");
const { default: mongoose } = require("mongoose");

//@desc     Get all Orders
//@route    GET /api/orders
//@access   Private
const getOrders = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const paginationOptions = {
      skip: (page - 1) * limit,
      limit: parseInt(limit, 10),
    };

    const orders = await Order.find({}, {}, paginationOptions)
      .sort({ createdAt: -1 })
      .populate({
        path: "customer",
        select: "name",
      })
      .populate({
        path: "products.product",
        select: "name hasVariation variations", // Include the 'variations' field
        populate: {
          path: "variations",
        },
      });

    console.log(
      "🚀 ~ file: orderController.js:25 ~ getOrders ~ orders:",
      orders
    );
    const totalOrders = await Order.countDocuments();
    const hasNextPage = page * limit < totalOrders;
    const hasPrevPage = page > 1;

    const response = {
      orders,
      currentPage: page,
      hasNextPage,
      hasPrevPage,
      limit: limit.toString(),
      totalPages: Math.ceil(totalOrders / limit),
      totalCount: totalOrders,
    };

    res.status(200).json(response);
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

//@desc     Get a Order
//@route    GET /api/order/:id
//@access   Private
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(400);
    throw new Error("Order not found");
  }

  res.status(200).json(order);
});

//@desc     Get Ordered Products by Date
//@route    DELETE /api/orders/:id
//@access   Private
const getOrderedProductByDate = asyncHandler(async (req, res) => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set time to midnight
    console.log(
      "🚀 ~ file: server.js:195 ~ app.use ~ currentDate:",
      currentDate
    );

    const orderedProductsByDate = await Order.aggregate([
      {
        $match: {
          processingDate: {
            $gte: currentDate,
            $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000), // Next day
          },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $group: {
          _id: {
            product: "$products.product",
            variation: "$products.variation",
          },
          quantity: { $sum: "$products.quantity" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id.product",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: "$product",
      },
      {
        $lookup: {
          from: "products",
          localField: "product.variations._id",
          foreignField: "variations._id",
          as: "variations",
        },
      },
      {
        $unwind: {
          path: "$variations",
          // to include documents whose sizes field is null, missing, or an empty array.
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $addFields: {
          variationUnit: {
            $arrayElemAt: [
              "$variations.variations.unit",
              {
                $indexOfArray: ["$variations.variations._id", "$_id.variation"],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            product: "$product.name",
            variation: "$_id.variation",
          },
          quantity: { $sum: "$quantity" },
          variationUnit: { $first: "$variationUnit" },
        },
      },
      {
        $group: {
          _id: "$_id.product",
          variations: {
            $push: {
              k: "$variationUnit",
              v: "$quantity",
            },
          },
          quantity: { $sum: "$quantity" },
        },
      },
      {
        $project: {
          _id: 0,
          product: "$_id",
          quantity: {
            $cond: [{ $ne: ["$quantity", 0] }, "$quantity", null],
          },
          variations: {
            $cond: [
              { $ne: ["$variations", []] },
              {
                $arrayToObject: "$variations",
              },
              null,
            ],
          },
        },
      },
    ]);

    console.log(orderedProductsByDate);

    console.log(
      "🚀 ~ file: orderController.js:125 ~ getOrderedProductByDate ~ orderedProductsByDate:",
      orderedProductsByDate
    );
    if (!orderedProductsByDate) {
      res.status(400);
      throw new Error("Order not found");
    }

    const response = {
      orderedProductsByDate,
    };

    res.status(200).json(orderedProductsByDate);
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

//@desc     Create order
//@route    POST /api/orders
//@access   Private
const createOrder = asyncHandler(async (req, res) => {
  try {
    const { products } = req.body;
    let totalPrice = 0;

    for (const product of products) {
      const { product: productId, variation, quantity } = product;
      const productData = await Product.findById(productId);
      console.log(
        "🚀 ~ file: orderController.js:74 ~ createOrder ~ productData:",
        productData
      );
      if (!productData) {
        return res.status(400).json({ error: "Invalid product selected" });
      }

      const hasVariations = productData.hasVariation;
      let productPrice;

      if (hasVariations && variation) {
        const variationData = productData.variations.find(
          (v) => v._id.toString() === variation
        );
        if (!variationData) {
          return res.status(400).json({ error: "Invalid variation selected" });
        }

        productPrice = variationData.price;
      } else {
        productPrice = productData.unitPrice;
      }

      totalPrice += productPrice * quantity;
    }

    const order = new Order({
      customer: req.body.customer,
      products: req.body.products,
      totalPrice: totalPrice,
      deliveryAddress: req.body.deliveryAddress,
      deliveryDate: req.body.deliveryDate,
      processingDate: req.body.processingDate,
    });

    await order.save();

    return res.json(order);
  } catch (error) {
    console.log(
      "🚀 ~ file: orderController.js:110 ~ createOrder ~ error:",
      error
    );
    return res.status(500).json({ error: "An error occurred" });
  }
});

//@desc     Update Order
//@route    PUT /api/order/:id
//@access   Private
const updateOrder = asyncHandler(async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    console.log("🚀 ~ order:", order);

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    const { products } = req.body;
    let totalPrice = 0;

    for (const product of products) {
      const { product: productId, variation, quantity } = product;
      const productData = await Product.findById(productId);
      console.log("🚀 ~ productData:", productData);

      if (!productData) {
        return res.status(400).json({ error: "Invalid product selected" });
      }

      const hasVariations = productData.hasVariation;
      let productPrice;

      if (hasVariations && variation) {
        const variationData = productData.variations.find(
          (v) => v._id.toString() === variation
        );
        if (!variationData) {
          return res.status(400).json({ error: "Invalid variation selected" });
        }

        productPrice = variationData.price;
      } else {
        productPrice = productData.unitPrice;
      }

      totalPrice += productPrice * quantity;
    }

    order.customer = req.body.customer;
    order.products = req.body.products;
    order.totalPrice = totalPrice;
    order.deliveryAddress = req.body.deliveryAddress;
    order.deliveryDate = req.body.deliveryDate;
    order.processingDate = req.body.processingDate;

    const updatedOrder = await order.save();

    return res.json(updatedOrder);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    return res.status(500).json({ error: "An error occurred" });
  }
});

//@desc     Delete Order
//@route    DELETE /api/orders/:id
//@access   Private
const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(400);
    throw new Error("Order not found");
  }

  await order.remove();
  res.status(200).json({ id: req.params.id });
});

module.exports = {
  getOrders,
  getOrder,
  getOrderedProductByDate,
  createOrder,
  updateOrder,
  deleteOrder,
};
