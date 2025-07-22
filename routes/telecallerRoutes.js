const express = require("express");
const router = express.Router();
const Telecaller = require("../models/Telecaller");
const Customer = require("../models/Customer");
const Order = require("../models/Order");
const Partner = require("../models/Partner");
const StoreNotification = require("../models/StoreNotification");

// Create a new Telecaller (POST)
router.post("/telecaller/add", async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      city,
      state,
      pinCode,
      pan,
      aadhar,
      bankAccNumber,
      IFSC,
      accountHolderName,
    } = req.body;

    // Check required fields
    if (
      !name ||
      !email ||
      !mobile ||
      !city ||
      !state ||
      !pinCode ||
      !pan ||
      !aadhar
    ) {
      return res
        .status(400)
        .json({ error: "All required fields must be provided." });
    }

    const newTelecaller = new Telecaller({
      name,
      email,
      mobile,
      city,
      state,
      pinCode,
      pan,
      aadhar,
      bankAccNumber: bankAccNumber || null,
      IFSC: IFSC || null,
      accountHolderName: accountHolderName || null,
    });

    await newTelecaller.save();
    res
      .status(201)
      .json({ message: "Telecaller added successfully", data: newTelecaller });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error:
          "Duplicate entry. Email, mobile, PAN, Aadhar, or Bank Account already exists.",
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get Telecaller by ID (GET)
router.get("/telecaller/:id", async (req, res) => {
  try {
    const telecaller = await Telecaller.findById(req.params.id);
    if (!telecaller) {
      return res.status(404).json({ message: "Telecaller not found" });
    }
    res.json(telecaller);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID format" });
  }
});
router.post("/telecaller/addorder/:id", async (req, res) => {
  try {
    const telecaller = await Telecaller.findById(req.params.id);
    if (!telecaller) {
      return res.status(404).json({ message: "Telecaller not found" });
    }
    const { order, commission } = req.body;
    const newOrder = new Order(order);
    const order1 = await newOrder.save();

    telecaller.orders.push(order1._id);
    telecaller.commission += commission;
    telecaller.remainingBalance += commission;
    // console.log(commission);

    const UpdatedTelecaller = await telecaller.save();
    const newNotification = new StoreNotification({
      zipCode: order.user_info.zipCode,
      message: `New order placed by ${order.user_info.name}!`,
      status: "unread",
    });
    try {
      await newNotification.save();
    } catch (err) {
      console.log(err);
    }
    res.status(201).json({
      message: "Order added successfully",
      orderData: order1,
      telecallerData: UpdatedTelecaller,
    });
  } catch (error) {
    res
      .status(400)
      .json({ error: `Error while Adding Order By Telecaller: ${error}` });
    console.log("Error while Adding Order By Telecaller:", error);
  }
});
// Get All Telecallers (GET)
router.get("/telecallers/all", async (req, res) => {
  try {
    const telecallers = await Telecaller.find();
    res.json(telecallers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Telecaller Status (PATCH)
router.put("/telecaller/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Accepted", "Rejected", "Hold"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const updatedTelecaller = await Telecaller.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedTelecaller) {
      return res.status(404).json({ message: "Telecaller not found" });
    }

    res.json({
      message: "Status updated successfully",
      data: updatedTelecaller,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete Telecaller (DELETE)
router.delete("/telecaller/:id", async (req, res) => {
  try {
    const deletedTelecaller = await Telecaller.findByIdAndDelete(req.params.id);
    if (!deletedTelecaller) {
      return res.status(404).json({ message: "Telecaller not found" });
    }

    res.json({ message: "Telecaller deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: "Invalid ID format" });
  }
});
// Delete Telecaller (DELETE)
// Get Telecaller Details (GET)
router.get("/get-customer/:number", async (req, res) => {
  const { number } = req.params;
  console.log("hello " + number);

  try {
    const customer = await Customer.findOne({ phone: number });

    if (!customer) {
      return res
        .status(404)
        .json({ status: false, message: "Telecaller not found" });
    }

    res.status(200).json({
      status: true,
      message: "Telecaller fetched successfully",
      data: customer,
    });
  } catch (error) {
    res.status(400).json({ status: false, message: "Invalid ID format" });
  }
});

router.get("/get/pincodes", async (req, res) => {
  try {
    const partners = await Partner.find({ status: "Accepted" });

    // Extract pincodes correctly
    const pincodes = partners.map((prt) => prt.pinCode);

    return res.status(200).json({ success: true, message: pincodes });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message,
    });
  }
});

module.exports = router;
