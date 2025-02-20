const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const orderDraftSchema = mongoose.Schema(
  {
    customerDetails: {
      type: String,
      required: [true, "customer Details is required"],
    },
    orderDetails: {
      type: String,
      required: [true, "Order Details is required"],
    },
    processingDate: {
      type: Date,
      required: [true, "Processing Date is required"],
    },
  },
  {
    timestamps: true,
  }
);

orderDraftSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("OrderDraft", orderDraftSchema);
