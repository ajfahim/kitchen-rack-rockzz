const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const variationSchema = mongoose.Schema({
  unit: {
    type: String,
    required: [
      true,
      "variation Name is required (example: kg, g, l, ml, ect.)",
    ],
  },
  price: {
    type: Number,
    required: [true, "variation Price is required"],
  },
});

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product Name is required"],
    },
    hasVariation: {
      type: Boolean,
      required: [true, "Product Name is required"],
    },
    variations: {
      type: [variationSchema], // Array of variation objects
    },
    unitPrice: {
      type: Number,
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.plugin(mongoosePaginate);
// Exporting the product and variation schemas
const Product = mongoose.model("Product", productSchema);
module.exports = { Product, variationSchema };
