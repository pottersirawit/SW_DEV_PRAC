const mongoose = require("mongoose");
const DentistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
    unique: true,
    trim: true,
    maxlength: [50, "Name can not be more than 50 characters"],
  },
  exp: {
    type: Number,
    required: [true, "Please add years of experience"],
  },
  area: {
    type: String,
    required: [true, "Please add an area of expertise"],
  },
});

module.exports = mongoose.model("Dentist", DentistSchema);
