const express = require("express");
const StoreNotification = require("../models/StoreNotification");

const router = express.Router();

router.get("/orders/:zipCode", async (req, res) => {
  try {
    const { zipCode } = req.params;

    // Fetch orders by zipCode and sort in newest first order
    const orders = await StoreNotification.find({ zipCode }).sort({
      createdAt: -1,
    });

    // Update status to "read" for all fetched records
    await StoreNotification.updateMany(
      { zipCode, status: "unread" }, // Only update unread notifications
      { $set: { status: "read" } }
    );

    // If notifications exceed 1000, delete the oldest 750
    const totalNotifications = await StoreNotification.countDocuments({
      zipCode,
    });
    if (totalNotifications > 1000) {
      const oldestNotifications = await StoreNotification.find({ zipCode })
        .sort({ createdAt: 1 }) // Oldest first
        .limit(750)
        .select("_id");

      const oldestIds = oldestNotifications.map((notif) => notif._id);
      await StoreNotification.deleteMany({ _id: { $in: oldestIds } });
    }

    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete all orders related to the zipCode
router.delete("/orders/:zipCode", async (req, res) => {
  try {
    const { zipCode } = req.params;
    const result = await StoreNotification.deleteMany({ zipCode });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} orders deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
