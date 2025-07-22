const mongoose = require("mongoose");

const partnerSchema = new mongoose.Schema(
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
    address: {
      type: String,
      required: true,
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
    gst: {
      type: String,
      unique: true,
      trim: true,
      default: null, // GST is optional
    },
    designation: {
      type: String,
      enum: ["StorePartner"],
      default: "StorePartner",
      required: true,
    },
    status: {
      type: String,
      enum: ["Accepted", "Rejected", "Hold"],
      default: "Hold", // Default value set at the schema level
      required: true,
    },
    riders: [{ type: mongoose.Schema.Types.ObjectId, ref: "BikeRider" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Partner", partnerSchema);
