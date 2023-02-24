const mongoose = require('mongoose');

const customerSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "customer name is required"],
    },
    phone: {
        type: String,
        required: [true, "customer phone number is required"],
    },
    email: {
        type: String,
    },
    address: {
        type: String,
        required: [true, "customer address is required"],
    },
},
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Customer", customerSchema)