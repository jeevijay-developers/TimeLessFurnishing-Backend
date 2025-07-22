const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    orderId: {
      type: Number,
      ref: "Order",
      required: true,
    },
    bikeRiderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BikeRider",
      required: true,
    },
    storeId: {
      type: String,
      required: true,
    },
    orderAssignTime: {
      type: Date,
      required: true,
    },
    orderCompletionTime: {
      type: Date,
      required: false,
    },
    status: {
      type: Boolean,
      default: false,
    },
    amount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Delivery", deliverySchema);
