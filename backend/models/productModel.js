const mongoose = require('mongoose');

const variationSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "variation Name is required (example: kg, g, l, ml, ect.)"]
    },
    price: {
        type: Number,
        required: [true, "variation Price is required"]
    }
});

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Product Name is required"]
    },
    variations: {
        type: [variationSchema], // Array of variation objects
    },
    unitPrice: {
        type: Number,
    },
    image: {
        type: String,
        required: [true, "Product image is required"]
    }
},
    {
        timestamps: true
    });

// Exporting the product and variation schemas
const Product = mongoose.model('Product', productSchema);
module.exports = { Product, variationSchema };
