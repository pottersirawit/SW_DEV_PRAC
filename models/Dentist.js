const mongoose = require("mongoose");
const DentistSchema = new mongoose.Schema(
  {
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
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

DentistSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    console.log(`Bookings being removed from dentist ${this._id}`);
    await this, model("Booking").deleteMany({ dentist: this._id });
    next();
  }
);

DentistSchema.virtual("bookings", {
  ref: "Booking",
  localField: "_id",
  foreignField: "dentist",
  justOne: false,
});

module.exports = mongoose.model("Dentist", DentistSchema);
