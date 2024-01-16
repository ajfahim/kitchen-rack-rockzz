const asyncHandler = require("express-async-handler");

const { Product } = require("../models/productModel");

//@desc     Get all Products
//@route    GET /api/products
//@access   Private
const getProducts = asyncHandler(async (req, res) => {
  // get query params
  try {
    const { page = 1, limit = 10, search } = req.query;
    // options for mongoose-paginate-v2
    const paginationOptions = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };
    // Define the base query
    const baseQuery = {};

    // If there is a search query, modify the base query to include the search condition
    if (search) {
      // Customize this part based on your schema and how you want to perform the search
      baseQuery.$or = [{ name: { $regex: new RegExp(search, "i") } }];
    }
    // count products
    const totalProducts = await Product.countDocuments(baseQuery);
    //pagination
    const products = await Product.paginate(baseQuery, paginationOptions);

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
  } catch (error) {
    res.status(500).json({ message: "something went wrong" });
  }
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

  // Call the validation function before creating the product
  validateProduct(req, res, async () => {
    const product = await Product.create(req.body);
    res.status(200).json(product);
  });
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

  // Call the validation function before updating the product
  validateProduct(req, res, async () => {
    if (req.body.hasVariation && product.unitPrice !== undefined) {
      // Delete unit price from the database
      await Product.findByIdAndUpdate(req.params.id, {
        $unset: { unitPrice: 1 },
      });
    }

    if (
      !req.body.hasVariation &&
      product.variations &&
      product.variations.length > 0
    ) {
      // Delete variations from the database
      await Product.findByIdAndUpdate(req.params.id, {
        $unset: { variations: 1 },
      });
    }
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.status(200).json(updatedProduct);
  });
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

//@desc     Seatch Product by Name
//@route    GET /api/products/:name
//@access   Private
const searchProductByName = asyncHandler(async (req, res) => {
  // get query params
  const { name } = req.params;

  const pipeline = [];

  if (name) {
    pipeline.push({
      $match: {
        name: { $regex: name, $options: "i" },
      },
    });
  }

  pipeline.push({
    $project: {
      hasVariation: 1,
      variations: 1,
      unitPrice: 1,
      label: "$name",
      value: "$_id",
    },
  });

  const products = await Product.aggregate(pipeline);

  res.status(200).json(products);
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProductByName,
};

const validateProduct = (req, res, next) => {
  const { hasVariation, variations, unitPrice } = req.body;

  if (hasVariation && unitPrice) {
    // Both variations and unitPrice are present
    res.status(400).json({
      error: "Validation Error",
      message:
        "Both variations and unit price cannot be present at the same time",
    });
  } else if (
    !hasVariation &&
    (!variations || variations.length === 0) &&
    !unitPrice
  ) {
    // Neither variations nor unitPrice are present
    res.status(400).json({
      error: "Validation Error",
      message: "Either variations or unit price must be present",
    });
  } else {
    next();
  }
};
