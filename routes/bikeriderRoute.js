const express = require("express");
const {
  addBikeRider,
  getAllBikeRiders,
  getRiderByNameOrNumber,
  assignBikeRider,
  pendingDeliveries,
  loginBikeRider,
  updateOrderDeleveryStatus,
  updateOrderCompletionStatus,
  deleteRider,
  getMyDeleveries,
  getBikeRiderById,
} = require("../controller/bikeRiderController");
const router = express.Router();

//register a staff
router.post("/add-rider/:partnerId", addBikeRider);
router.post("/login-rider", loginBikeRider);
router.get(
  "/update-delevery/:orderId/:deliveryId/:status",
  updateOrderDeleveryStatus
);

//login a admin
router.get("/get-all-riders", getAllBikeRiders);

//forget-password
router.get("/get-rider/:identifier", getRiderByNameOrNumber);
router.get("/get-rider/by-id/:id", getBikeRiderById);

//reset-password
router.get("/assign-rider/:orderId/:riderId/:shopId", assignBikeRider);

//add a staff
router.put("/order-deliverd/:orderId/:riderId", updateOrderCompletionStatus);

router.get("/pending-deliveries/:riderId", pendingDeliveries);
router.delete("/delete/:riderId", deleteRider);
router.get("/my-deliveries/:id", getMyDeleveries);

module.exports = router;
