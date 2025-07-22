const express = require("express");
const router = express.Router();
const Partner = require("../models/Partner");
const Order = require("../models/Order");
const Delivery = require("../models/Delivery");

// Create a new Store Owner (POST)
router.post("/partner/add", async (req, res) => {
  try {
    const newOwner = new Partner(req.body);
    console.log(newOwner);
    await newOwner.save();
    res
      .status(201)
      .json({ message: "Store owner created successfully", data: newOwner });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/partner/rider/:id", async (req, res) => {
  try {
    const rider = await Partner.findById(req.params.id).populate("riders");
    if (!rider)
      return res.status(404).json({ message: "Bike rider not found" });
    res.json(rider.riders);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID format" });
  }
});

// Get Store Owner by ID (GET)
router.get("/partner/:id", async (req, res) => {
  try {
    const owner = await Partner.findById(req.params.id);
    if (!owner)
      return res.status(404).json({ message: "Store owner not found" });
    res.json(owner);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID format" });
  }
});

// Get All Store Owners (GET)
router.get("/partners/all", async (req, res) => {
  try {
    const owners = await Partner.find();
    res.json(owners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Partner Status (PATCH)
router.put("/partner/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Accepted", "Rejected", "Hold"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const updatedPartner = await Partner.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedPartner)
      return res.status(404).json({ message: "Partner not found" });

    res.json({ message: "Status updated successfully", data: updatedPartner });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET API to fetch orders by zip code
router.get("/orders/zip-5/:zipCode", async (req, res) => {
  const { zipCode } = req.params;

  try {
    const orders = await Order.find({ "user_info.zipCode": zipCode })
      .limit(5)
      .sort({ createdAt: -1 }); // Limit the result to 5 orders

    if (orders.length === 0) {
      return res
        .status(404)
        .json({ message: "No orders found for this zip code." });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders by zip code:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.get("/orders/zip/:zipCode", async (req, res) => {
  const { zipCode } = req.params;
  const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
  const limit = parseInt(req.query.limit) || 5; // Default to 5 records per page

  try {
    const totalOrders = await Order.countDocuments({
      "user_info.zipCode": zipCode,
    }); // Count total orders
    const orders = await Order.find({ "user_info.zipCode": zipCode })
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip((page - 1) * limit) // Skip previous pages
      .limit(limit); // Limit records per page

    if (orders.length === 0) {
      return res
        .status(404)
        .json({ message: "No orders found for this zip code." });
    }

    res.status(200).json({
      totalOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders by zip code:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.get("/orders/zip/:zipCode/pending", async (req, res) => {
  const { zipCode } = req.params;
  const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
  const limit = parseInt(req.query.limit) || 5; // Default to 5 records per page
  console.log("hello");

  try {
    const filter = {
      "user_info.zipCode": zipCode,
      status: { $in: ["Pending", "Processing"] }, // Filter for orders with status "Pending" or "Processing"
    };

    const totalOrders = await Order.countDocuments(filter); // Count total matching orders

    const orders = await Order.find(filter) // ✅ Correct filter applied
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip((page - 1) * limit) // Skip previous pages
      .limit(limit);

    if (orders.length === 0) {
      return res.status(404).json({
        message: "No pending or processing orders found for this zip code.",
      });
    }

    res.status(200).json({
      totalOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders by zip code:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// GET API to fetch deliveries by storeId
router.get("/deliveries/store/:storeId", async (req, res) => {
  const { storeId } = req.params;

  try {
    const deliveries = await Delivery.find({ storeId });

    if (!deliveries || deliveries.length === 0) {
      return res
        .status(404)
        .json({ message: "No deliveries found for this store." });
    }

    res.status(200).json(deliveries);
  } catch (error) {
    console.error("Error fetching deliveries by storeId:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// GET: Dashboard Metrics for a specific store
router.get("/store/:storeId/stats", async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Partner.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Date calculations
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date();
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date();
    endOfYesterday.setDate(endOfYesterday.getDate() - 1);
    endOfYesterday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Aggregation pipeline for income calculations
    const incomeStats = await Delivery.aggregate([
      { $match: { storeId } },
      {
        $facet: {
          todayIncome: [
            { $match: { createdAt: { $gte: startOfDay } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ],
          yesterdayIncome: [
            {
              $match: {
                createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
              },
            },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ],
          thisMonthIncome: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ],
          allTimeIncome: [
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ],
        },
      },
    ]);

    // Order counts
    const totalOrders = await Delivery.countDocuments({ storeId });
    const [processingOrders, pendingOrders, cancelOrders] = await Promise.all([
      Delivery.aggregate([
        { $match: { storeId } },
        {
          $lookup: {
            from: "orders",
            localField: "orderId",
            foreignField: "invoice",
            as: "order",
          },
        },
        { $unwind: "$order" },
        { $match: { "order.status": "Processing" } },
        { $count: "count" },
      ]),

      Delivery.aggregate([
        { $match: { storeId } },
        {
          $lookup: {
            from: "orders",
            localField: "orderId",
            foreignField: "invoice",
            as: "order",
          },
        },
        { $unwind: "$order" },
        { $match: { "order.status": "Pending" } },
        { $count: "count" },
      ]),

      Delivery.aggregate([
        { $match: { storeId } },
        {
          $lookup: {
            from: "orders",
            localField: "orderId",
            foreignField: "invoice",
            as: "order",
          },
        },
        { $unwind: "$order" },
        { $match: { "order.status": "Cancelled" } },
        { $count: "count" },
      ]),
    ]);

    const deliveredOrders = await Delivery.countDocuments({
      storeId,
      status: true,
    });

    // console.log(pendingOrders, cancelOrders, processingOrders);
    const pinCode = store.pinCode;
    console.log(pinCode);

    const pending = await Order.countDocuments({
      "user_info.zipCode": pinCode,
      status: "Pending",
    });
    // Response
    res.json({
      income: {
        today: incomeStats[0].todayIncome[0]?.total || 0,
        yesterday: incomeStats[0].yesterdayIncome[0]?.total || 0,
        thisMonth: incomeStats[0].thisMonthIncome[0]?.total || 0,
        allTime: incomeStats[0].allTimeIncome[0]?.total || 0,
      },
      orders: {
        total: totalOrders,
        processing: processingOrders[0]?.count || 0,
        pending: pending || 0,
        delivered: deliveredOrders,
        canceled: cancelOrders[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching store stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/update/:id", async (req, res) => {
  const newStatus = req.body.status;

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    if (order.status === "Delivered") {
      return res
        .status(400)
        .send({ message: "Order is already marked as Delivered" });
    }

    await Order.updateOne(
      { _id: req.params.id },
      { $set: { status: newStatus } }
    );

    res.status(200).send({ message: "Order Updated Successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.put("/update/profile/:id", async (req, res) => {
  const partnerId = req.params.id;
  const updateData = req.body;

  try {
    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).send({ message: "Partner not found" });
    }

    const updatedPartner = await Partner.findByIdAndUpdate(
      partnerId,
      { $set: updateData },
      { new: true, runValidators: true } // Returns updated document & runs schema validation
    );

    return res.status(200).json({
      message: "Profile updated successfully!",
      data: updatedPartner,
    });
  } catch (err) {
    console.error("Error updating partner profile:", err);
    return res
      .status(500)
      .json({ message: "Server error, unable to update profile" });
  }
});

router.get("/partner/orders/:id", async (req, res) => {
  const id = req.params.id;
  const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
  const limit = parseInt(req.query.limit) || 5; // Default to 5 records per page

  try {
    // Fetch delivery details with pagination
    const deleveryWithStore = await Delivery.find({ storeId: id })
      .populate("riderId")
      .skip((page - 1) * limit)
      .limit(limit);

    const totalOrders = await Delivery.countDocuments({ storeId: id });

    if (deleveryWithStore.length === 0) {
      return res.status(404).json({ message: "No deliveries found" });
    }

    // Extract invoices from deliveries
    const invoices = deleveryWithStore.map((delivery) => delivery.orderId);

    const constrain = ["Delivered", "Cancelled"];

    // Find orders matching invoices & status constraint
    const orders = await Order.find({
      invoice: { $in: invoices },
      status: { $in: constrain },
    });

    if (orders.length === 0) {
      return res.status(404).json({
        message: "No matching orders found",
      });
    }

    // Map orders with their deliveries
    const responseData = orders.map((order) => {
      const relatedDeliveries = deleveryWithStore.filter(
        (delivery) => delivery.orderId === order.invoice // Ensure ObjectId comparison
      );
      return { order, deliveries: relatedDeliveries };
    });

    res.json({
      totalOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      orders: responseData,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
