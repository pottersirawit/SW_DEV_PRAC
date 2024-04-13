const Booking = require("../models/Booking");
const Dentist = require("../models/Dentist");
const nodeMailer = require("nodemailer");
const schedule = require("node-schedule");

//@desc Get all bookings
//@route GET /api/v1/bookings
//@access Public
exports.getBookings = async (req, res, next) => {
  let query;
  //General users can see only their appointments!
  if (req.user.role !== "admin") {
    console.log(req.user.id);
    query = Booking.find({ user: req.user.id }).populate({
      path: "dentist",
      select: "name exp area",
    });
  } else {
    if (req.params.dentistId) {
      console.log(req.params.dentistId);
      query = Booking.find({ dentist: req.params.dentistId }).populate({
        path: "dentist",
        select: "name exp area",
      });
    } else {
      query = Booking.find().populate({
        path: "dentist",
        select: "name exp area",
      });
    }
  }

  try {
    console.log(query);
    const bookings = await query;
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot Find Booking" });
  }
};

//@desc Get a booking
//@route GET /api/v1/bookings
//@access Public
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: "dentist",
      select: "name exp area",
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `There is no booking with the id of ${req.params.id}`,
      });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot find the booking" });
  }
};

//@desc Create a booking
//@route POST /api/v1/bookings
//@access Public
exports.addBooking = async (req, res, next) => {
  try {
    req.body.dentist = req.params.dentistId;
    console.log(req.params.dentistId);

    const dentist = await Dentist.findById(req.params.dentistId);

    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: `There is no dentist with the id of ${req.params.dentistId}`,
      });
    }

    req.body.user = req.user.id;

    const existedBookings = await Booking.find({ user: req.user.id });
    //user can book only ONE session
    if (existedBookings.length >= 1 && req.user.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: `The user with ID ${req.user.id} has already made a booking`,
      });
    }

    const booking = await Booking.create(req.body);
    const originalDate = new Date(booking.apptDate);
    const reminderDate = new Date(originalDate.getTime() - 7 * 60 * 60 * 1000);
    schedule.scheduleJob(req.user.id, reminderDate, function () {
      // console.log("Sent Reminder");
      sentReminder(booking);
    });
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot create the booking" });
  }
};

//@desc Edit a booking
//@route PUT /api/v1/bookings
//@access Public
exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `There is no booking with the id of ${req.params.id}`,
      });
    }

    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to make change on this booking`,
      });
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    schedule.cancelJob(req.user.id);
    const originalDate = new Date(booking.apptDate);
    const reminderDate = new Date(originalDate.getTime() - 7 * 60 * 60 * 1000);
    schedule.scheduleJob(req.user.id, reminderDate, function () {
      // console.log("Sent Reminder");
      sentReminder(booking);
    });

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot update the booking" });
  }
};

//@desc Delete a booking
//@route DELETE /api/v1/bookings
//@access Public
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `There is no booking with the id of ${req.params.id}`,
      });
    }
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this booking`,
      });
    }

    await booking.deleteOne();
    schedule.cancelJob(req.user.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot delete the booking" });
  }
};

exports.sentReminder = async (booking) => {
  const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Reminder</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f7f7f7;
            padding: 20px;
            text-align: center;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #333;
        }
        p {
            font-size: 18px;
            color: #555;
            margin: 10px 0;
        }
        .appointment-info {
            border-top: 1px solid #ccc;
            padding-top: 15px;
            margin-top: 15px;
        }
        .appointment-info p {
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Appointment Reminder</h1>
        <p>You have an appointment with your dentist tomorrow!</p>
        <div class="appointment-info">
            <p><strong>Date & Time:</strong> ${booking.apptDate}</p>
            <p><strong>Dentist:</strong> ${booking.dentist}</p>
        </div>
    </div>
</body>
</html>

    `;
  const username = process.env.USERNAME;
  const password = process.env.PASSWORD;
  const receiver = "sirawit.pulketkij@gmail.com";
  try {
    const transporter = nodeMailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: username,
        pass: password,
      },
    });

    const info = await transporter.sendMail({
      from: username,
      to: receiver,
      subject: "Appointment Reminder",
      html: html,
    });

    console.log("Message sent: " + info.messageId);
    return res.status(200).json({ success: true, data: info.messageId });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: `Cannot sent an email` });
  }
};
