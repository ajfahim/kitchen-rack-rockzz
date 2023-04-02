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
        validate: [
            // Custom validation function to check if either variations or unitPrice is present
            function (value) {
                return (this.unitPrice === undefined && value.length > 0) || (this.variations.length === 0 && this.unitPrice !== undefined);
            },
            'Either variations or unitPrice is required, but not both'
        ]
    },
    unitPrice: {
        type: Number,
        validate: [
            // Custom validation function to check if either variations or unitPrice is present
            function (value) {
                return (this.variations.length === 0 && value !== undefined) || (this.variations.length > 0 && value === undefined);
            },
            'Either variations or unitPrice is required, but not both'
        ]
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
