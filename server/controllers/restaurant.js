const Restaurant = require("../models/resturant");

const Validator = require("validatorjs");

const createResturant = async (req, res) => {
  try {
    const { name, address, phone, rating, image } = req.body;

    console.log(req.user);

    const rules = {
      name: "required",
      address: "required",
      phone: "required|regex:/^[0-9]{10}$/",
    };

    const validation = new Validator(req.body, rules);

    if (validation.fails()) {
      return res.status(400).json({
        error: "Invalid input data",
        validationErrors: validation.errors.all(),
      });
    }

    const newResturant = new Restaurant({
      name,
      address,
      phone,
      rating,
      image,
    });

    await newResturant.save();

    res.status(201).json({
      message: "Resturant created successfully",
      resturant: newResturant,
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

const listResturant = async (req, res) => {
  try {
    let list = await Restaurant.find();

    res.status(201).json({
      message: "Restuarant Fetched Successfully",
      resturant: list,
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

module.exports = {
  createResturant,
  listResturant,
};
