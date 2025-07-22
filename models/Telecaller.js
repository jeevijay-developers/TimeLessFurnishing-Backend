const { orders } = require("@paypal/checkout-server-sdk");
const mongoose = require("mongoose");

const telecallerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pinCode: {
      type: String,
      required: true,
      trim: true,
    },
    pan: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    aadhar: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    bankAccNumber: {
      type: String,
      unique: true,
      trim: true,
      default: null, // GST is optional
    },
    IFSC: {
      type: String,
      trim: true,
      default: null, // GST is optional
    },
    accountHolderName: {
      type: String,
      trim: true,
      default: null, // GST is optional
    },
    designation: {
      type: String,
      enum: ["Telecaller"],
      default: "Telecaller",
      required: true,
    },
    status: {
      type: String,
      enum: ["Accepted", "Rejected", "Hold"],
      default: "Hold", // Default value set at the schema level
      required: true,
    },
    commission: {
      type: Number,
      default: 0,
      required: true,
      min: 0,
    },
    remainingBalance: {
      type: Number,
      default: 0,
      required: true,
      min: 0,
    },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Telecaller", telecallerSchema);
