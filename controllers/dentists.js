const Dentist = require("../models/Dentist");

exports.getDentists = async (req, res, next) => {
  let query;

  const reqQuery = { ...req.query };

  const removeField = ["select", "sort", "page", "limit"];
  removeField.forEach((param) => delete reqQuery[param]);
  console.log(reqQuery);

  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );
  query = Dentist.find(JSON.parse(queryStr));

  if (req.query.select) {
    const field = req.query.select.split(",").join(" ");
    query = query.select(field);
  }

  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  try {
    const total = await Dentist.countDocuments();
    query = query.skip(startIndex).limit(limit);

    const dentists = await query;
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }
    res.status(200).json({
      success: true,
      count: dentists.length,
      pagination,
      data: dentists,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

exports.getDentist = async (req, res, next) => {
  try {
    const dentists = await Dentist.findById(req.params.id);
    res
      .status(200)
      .json({ success: true, count: dentists.length, data: dentists });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

exports.createDentist = async (req, res, next) => {
  try {
    const dentist = await Dentist.create(req.body);
    res.status(201).json({
      success: true,
      data: dentist,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

exports.updateDentist = async (req, res, next) => {
  try {
    const dentist = await Dentist.findByIdAndUpdate(req.params, req.body, {
      new: true,
      runValidators: true,
    });
    if (!dentist) {
      return res.status(400).json({ success: false });
    }
    res.status(200).json({ success: true, data: dentist });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

exports.deleteDentist = async (req, res, next) => {
  try {
    const dentist = await Dentist.findByIdAndDelete(req.params.id);
    if (!dentist) {
      return res.status(400).json({ success: false });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};
