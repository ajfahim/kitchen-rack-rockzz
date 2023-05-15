const asyncHandler = require("express-async-handler");

const Customer = require("../models/customerModel");
const { paginatedResults } = require("../middleware/pagination");

//@desc     Get Customers
//@route    GET /api/customers
//@access   Private
const getCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find({});
  res.status(200).json(customers);
});

//@desc     Create Customer
//@route    POST /api/customers
//@access   Private
const createCustomer = asyncHandler(async (req, res) => {
  if (!req.body.email) {
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

module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
