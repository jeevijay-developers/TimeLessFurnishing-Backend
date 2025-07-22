const mongoose = require("mongoose");

const bikeRiderSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    match: /^\d{10}$/,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /.+@.+\..+/,
  },
  aadharNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{12}$/,
  },
  panNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  },
  bikeLicenceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: Boolean,
    default: false,
  },

  address: {
    street: String,
    city: String,
    state: String,
    postalCode: {
      type: String,
      match: /^\d{6}$/,
    },
  },
});

module.exports = mongoose.model("BikeRider", bikeRiderSchema);
