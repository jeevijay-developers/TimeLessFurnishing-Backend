const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    invoice: {
      type: Number,
      required: false,
      unique: true,
    },
    cart: [{}],
    user_info: {
      name: {
        type: String,
        required: false,
      },
      email: {
        type: String,
        required: false,
      },
      contact: {
        type: String,
        required: false,
      },
      state: {
        type: String,
        required: false,
      },
      landmark: {
        type: String,
        required: false,
      },
      address: {
        type: String,
        required: false,
      },
      city: {
        type: String,
        required: false,
      },
      country: {
        type: String,
        required: false,
      },
      zipCode: {
        type: String,
        required: false,
      },
      location: {
        type: String,
        required: false,
      },
    },
    subTotal: {
      type: Number,
      required: true,
    },
    shippingCost: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
    },
    shippingOption: {
      type: String,
      required: false,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    riderName: {
      type: String,
      default: "",
    },
    cardInfo: {
      type: Object,
      required: false,
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "ReturnRequested",
        "Returned",
        "ReturnRejected",
      ],
      default: "Pending",
    },
    deliveryDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// old code
// const Order = mongoose.model(
//   "Order",
//   orderSchema.plugin(AutoIncrement, {
//     inc_field: "invoice",
//     start_seq: 10000,
//   })
// );

// new code
// Pre-save middleware to generate invoice number manually
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoice) {
    try {
      // Find the highest invoice number and increment
      const lastOrder = await this.constructor.findOne({}, {}, { sort: { 'invoice': -1 } });
      
      if (lastOrder && lastOrder.invoice) {
        this.invoice = lastOrder.invoice + 1;
      } else {
        // Start from 10000 if no orders exist
        this.invoice = 10000;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
