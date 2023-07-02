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

    // const orders = await Order.find({}, {}, paginationOptions)
    //   .populate({
    //     path: "customer",
    //     select: "name",
    //   })
    //   .populate({
    //     path: "products.product",
    //   })
    //   .populate({
    //     path: "products.variation",
    //   });

    const orders = await Order.aggregate([
      {
        $lookup: {
          from: "products", // Assuming the variations collection name is "variations"
          localField: "products.product",
          foreignField: "_id",
          as: "aggproducts",
        },
      },
      {
        $unwind: "$aggproducts",
      },
      // {
      //   $unwind: {
      //     path: "$aggproducts.variations",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      // {
      //   $unwind: {
      //     path: "$products",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      // {
      //   $project: {
      //     items: {
      //       $filter: {
      //         input: "$products",
      //         as: "product",
      //         cond: {
      //           $eq: ["$$product.variations", "$aggproducts.variation._id"],
      //         },
      //       },
      //     },
      //   },
      // },
      // {
      //   $match: {
      //     $expr: {
      //       $eq: ["$aggproducts.variations._id", "$products.variations"],
      //     },
      //   },
      // },
      // {
      //   $addFields: {
      //     matchedVariations: {
      //       $filter: {
      //         input: "$aggproducts.variations",
      //         cond: { $in: ["$$this._id", "$products.variation"] },
      //       },
      //     },
      //   },
      // },
      // {
      //   $match: {"aggproducts.variations":"products.variation"
      // },
      // {
      //   $match: {
      //     populatedVariations: { $ne: [] }, // Filter orders that have populated variations
      //   },
      // },
    ]);

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
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(400);
    throw new Error("Order not found");
  }

  const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json(updatedOrder);
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
  createOrder,
  updateOrder,
  deleteOrder,
};
