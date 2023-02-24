const asyncHandler = require("express-async-handler")

//@desc     Get Customers
//@route    GET /api/customers
//@access   Private
const getCustomers = asyncHandler(async (req, res) => {
    res.status(200).json({ msg: "Get customers" })
})

//@desc     Create Customer
//@route    POST /api/customers
//@access   Private
const createCustomer = asyncHandler(async (req, res) => {

    if (!req.body.email) {
        res.status(400)
        throw new Error("No body received")
    }
    res.status(200).json({ msg: "Create customer" })
})

//@desc     Update Customer
//@route    PUT /api/customers/:id
//@access   Private
const updateCustomer = asyncHandler(async (req, res) => {
    res.status(200).json({ msg: `Update customer ${req.params.id}` })
})

//@desc     Delete Customer
//@route    DELETE /api/customers/:id
//@access   Private
const deleteCustomer = asyncHandler(async (req, res) => {
    res.status(200).json({ msg: `Delete customer ${req.params.id}` })
})

module.exports = {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
}