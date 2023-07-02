const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        variation: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Variation",
        },
        quantity: { type: Number, required: true },
      },
    ],
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed"],
      default: "pending",
    },
    deliveryAddress: { type: String, required: true },
    deliveryDate: { type: Date, required: true },
    processingDate: { type: Date, required: true },
  },
  { timestamps: true }
);

orderSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Order", orderSchema);
