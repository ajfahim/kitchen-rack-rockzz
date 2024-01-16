const asyncHandler = require("express-async-handler");
const Customer = require("../models/customerModel");

//@desc     Get Customers
//@route    GET /api/customers
//@access   Private
const getCustomers = asyncHandler(async (req, res) => {
  // get query params
  const { page = 1, limit = 10, search } = req.query;

  // Define the base query
  const baseQuery = {};

  // If there is a search query, modify the base query to include the search condition
  if (search) {
    // Customize this part based on your schema and how you want to perform the search
    baseQuery.$or = [
      { name: { $regex: new RegExp(search, "i") } },

      // Add more fields if needed
    ];
  }

  // options for mongoose-paginate-v2
  const paginationOptions = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  // total count with search conditions
  const totalCustomers = await Customer.countDocuments(baseQuery);

  // pagination with search conditions
  const customers = await Customer.paginate(baseQuery, paginationOptions);

  const { docs, hasNextPage, hasPrevPage } = customers;

  const response = {
    customers: docs,
    currentPage: paginationOptions.page,
    hasNextPage,
    hasPrevPage,
    limit: limit,
    totalPages: Math.ceil(totalCustomers / paginationOptions.limit),
    totalCount: totalCustomers,
  };

  res.status(200).json(response);
});

//@desc     Get Customer
//@route    GET /api/customers
//@access   Private
const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(400);
    throw new Error("Customer not found");
  }

  res.status(200).json(customer);
});

//@desc     Create Customer
//@route    POST /api/customers
//@access   Private
const createCustomer = asyncHandler(async (req, res) => {
  if (!req.body) {
    res.status(400);
    throw new Error("No body received");
  }

  const customer = await Customer.create(req.body);
  res.status(200).json(customer);
});

//@desc     Update Customer
//@route    PUT /api/customers/:id
//@access   Private
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(400);
    throw new Error("Customer not found");
  }

  const updatedCustomer = await Customer.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.status(200).json(updatedCustomer);
});

//@desc     Delete Customer
//@route    DELETE /api/customers/:id
//@access   Private
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(400);
    throw new Error("Customer not found");
  }

  await customer.remove();
  res.status(200).json({ id: req.params.id, name: customer.name });
});

//@desc     Seatch Customer by Name
//@route    GET /api/customers/:name
//@access   Private
const searchCustomerByName = asyncHandler(async (req, res) => {
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
      label: "$name",
      value: "$_id",
      address: 1,
    },
  });

  const customers = await Customer.aggregate(pipeline);

  res.status(200).json(customers);
});

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomerByName,
};
