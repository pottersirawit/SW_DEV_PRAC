const express = require("express");
const {
  getBookings,
  getBooking,
  addBooking,
  updateBooking,
  deleteBooking,
  sentReminder,
} = require("../controllers/bookings");

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require("../middleware/auth");

// router
//   .route("/email")
//   .get(protect,sentReminder)

router
  .route("/")
  .get(protect, getBookings)
  .post(protect, authorize("admin", "user"), addBooking);
router
  .route("/:id")
  .get(protect, getBooking)
  .put(protect, authorize("admin", "user"), updateBooking)
  .delete(protect, authorize("admin", "user"), deleteBooking);

module.exports = router;
