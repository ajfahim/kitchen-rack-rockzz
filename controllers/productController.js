const asyncHandler = require("express-async-handler");

const { Product } = require("../models/productModel");

//@desc     Get all Products
//@route    GET /api/products
//@access   Private
const getProducts = asyncHandler(async (req, res) => {
  // get query params
  const { page = 1, limit = 10 } = req.query;
  // options for mongoose-paginate-v2
  const paginationOptions = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
  // count products
  const totalProducts = await Product.countDocuments();
  //pagination
  const products = await Product.paginate({}, paginationOptions);

  const { docs, hasNextPage, hasPrevPage } = products;
  const response = {
    products: docs,
    currentPage: paginationOptions.page,
    hasNextPage,
    hasPrevPage,
    limit: limit,
    totalPages: Math.ceil(totalProducts / paginationOptions.limit),
    totalCount: totalProducts,
  };
  res.status(200).json(response);
});

//@desc     Get a Product
//@route    GET /api/products/:id
//@access   Private
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(400);
    throw new Error("Product not found");
  }

  res.status(200).json(product);
});

//@desc     Create Product
//@route    POST /api/products
//@access   Private
const createProduct = asyncHandler(async (req, res) => {
  if (!req.body.name) {
    res.status(400);
    throw new Error("No body received");
  }

  const product = await Product.create(req.body);
  res.status(200).json(product);
});

//@desc     Update Product
//@route    PUT /api/products/:id
//@access   Private
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(400);
    throw new Error("Product not found");
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  res.status(200).json(updatedProduct);
});

//@desc     Delete Product
//@route    DELETE /api/products/:id
//@access   Private
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(400);
    throw new Error("Product not found");
  }

  await product.remove();
  res.status(200).json({ id: req.params.id });
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
