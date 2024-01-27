const asyncHandler = require("express-async-handler");

const Order = require("../models/orderModel");
const { Product, Variation } = require("../models/productModel");
const { default: mongoose } = require("mongoose");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

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
  console.log("🚀 ~ file: orderController.js:61 ~ getOrder ~ req:", req.params);
  // const order = await Order.findById(req.params.id);
  const order = await Order.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(req.params.id) },
    },
    {
      $lookup: {
        from: "customers",
        foreignField: "_id",
        localField: "customer",
        as: "customer",
      },
    },
    {
      $unwind: "$customer",
    },
    {
      $addFields: {
        customer: "$customer.name",
      },
    },
    {
      $lookup: {
        from: "products",
        foreignField: "_id",
        localField: "products.product",
        as: "populatedProducts",
      },
    },
    {
      $addFields: {
        products: {
          $map: {
            input: "$products",
            as: "product",
            in: {
              product: {
                $arrayElemAt: [
                  "$populatedProducts.name",
                  {
                    $indexOfArray: [
                      "$populatedProducts._id",
                      "$$product.product",
                    ],
                  },
                ],
              },
              quantity: "$$product.quantity",
              _id: "$$product._id",
              variation: "$$product.variation",
              hasVariations: true,
            },
          },
        },
      },
    },
    {
      $project: {
        populatedProducts: 0, // Remove the temporary field "populatedProducts" from the output
      },
    },
  ]);

  if (!order) {
    res.status(400);
    throw new Error("Order not found");
  }

  res.status(200).json(order[0]);
});

//@desc     Get Ordered Products by Date
//@route    DELETE /api/orders/:id
//@access   Private
const getOrderedProductByDate = asyncHandler(async (req, res) => {
  try {
    const requestedDate = dayjs.tz(req.query.date, "Asia/Dhaka"); // Convert to BST

    const startOfDayBST = requestedDate.startOf("day");

    const endOfDayBST = requestedDate.endOf("day");

    const orderedProductsByDate = await Order.aggregate([
      {
        $match: {
          processingDate: {
            $gte: startOfDayBST.toDate(),
            $lt: endOfDayBST.toDate(),
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
              k: { $ifNull: ["$variationUnit", "No Variation"] },
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
      {
        $sort: { product: 1 },
      },
    ]);

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

//@desc     Get Orders by date
//@route    GET /api/orders/getOrdersByDate
//@access   Private
const getOrdersByDate = asyncHandler(async (req, res) => {
  console.log("🚀 ~ getOrdersByDate ~ req:", req.query);
  try {
    const requestedDate = dayjs.tz(req.query.date, "Asia/Dhaka"); // Convert to BST
    console.log(
      "🚀 ~ getOrdersByDate ~ requestedDate:",
      requestedDate.toDate()
    );

    const startOfDayBST = requestedDate.startOf("day");

    const endOfDayBST = requestedDate.endOf("day");

    const orders = await Order.find(
      {
        processingDate: {
          $gte: startOfDayBST.toDate(),
          $lt: endOfDayBST.toDate(),
        },
      },
      {}
    )

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
      })
      .sort({ "customer.name": 1 });

    const response = {
      orders,
    };

    res.status(200).json(response);
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

//@desc     Get Orders by Month for the current Year
//@route    GET /api/orders/monthly-sales
//@access   Private
const geMonthlySales = asyncHandler(async (req, res) => {
  try {
    const requestedYear = dayjs.tz(req.query.year, "Asia/Dhaka"); // Convert to BST
    // Convert current time to the desired timezone
    const currentTime = dayjs().tz("Asia/Dhaka");

    // Calculate the start and end dates of the current year

    let startOfYear =
      requestedYear === undefined
        ? currentTime.startOf("year")
        : requestedYear.startOf("year");
    let endOfYear =
      requestedYear === undefined
        ? currentTime.endOf("year")
        : requestedYear.endOf("year");

    // if (!!requestedYear) {
    //   startOfYear = requestedYear.startOf("year");
    //   endOfYear = requestedYear.endOf("year");
    // }

    // Aggregate the orders within the current year and group by month
    const salesData = await Order.aggregate([
      {
        $match: {
          processingDate: {
            $gte: startOfYear.toDate(),
            $lte: endOfYear.toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: { $add: ["$processingDate", 6 * 60 * 60 * 1000] }, // Convert to UTC+6 (BST)
            },
          },
          totalSales: { $sum: "$totalPrice" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Prepare the result in the desired format
    const formattedSalesData = salesData.map((data) => ({
      month: dayjs(data._id).format("MMM YY"), // Format the date to "July"
      totalSales: data.totalSales,
    }));

    res.json({ year: requestedYear.year(), data: formattedSalesData });
  } catch (error) {
    console.log("Error:", error);
    res
      .status(500)
      .json({ message: "Error fetching monthly sales data", error });
  }
});

//@desc     Get Orders by Date for the current Month
//@route    GET /api/orders/monthly-sales
//@access   Private
const getDailySales = asyncHandler(async (req, res) => {
  try {
    // Convert current time to the desired timezone
    const currentTime = dayjs().tz("Asia/Dhaka");
    console.log("Current server time:", currentTime.format());

    // Calculate the start and end dates of the current month
    const startOfMonth = currentTime.startOf("month");

    const endOfMonth = currentTime.endOf("month");

    // Aggregate the orders within the current month and group by day
    const salesData = await Order.aggregate([
      {
        $match: {
          processingDate: {
            $gte: startOfMonth.toDate(),
            $lte: endOfMonth.toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: { $add: ["$processingDate", 6 * 60 * 60 * 1000] }, // Convert to UTC+6 (BST)
            },
          },
          totalSales: { $sum: "$totalPrice" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Prepare the result in the desired format
    const formattedSalesData = salesData.map((data) => ({
      date: dayjs(data._id).format("MMM DD"),
      totalSales: data.totalSales,
    }));

    res.json({
      month: currentTime.format("MMMM YYYY"),
      data: formattedSalesData,
    });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ message: "Error fetching daily sales data", error });
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
  getOrdersByDate,
  getDailySales,
  geMonthlySales,
  createOrder,
  updateOrder,
  deleteOrder,
};
