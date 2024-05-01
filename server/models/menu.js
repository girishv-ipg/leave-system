const mongoose = require("mongoose");

// Define a schema for the category
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant", // Reference to the Restaurant model
    required: true,
  },
});

// Create a Mongoose model for categories
const Category = mongoose.model("Category", categorySchema);

// Define a schema for the item
const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  price: {
    type: Number,
    required: true,
  },
  temType: String,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category", // Reference to the Category model
    required: true,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant", // Reference to the Restaurant model
    required: true,
  },
});

// Create a Mongoose model for items
const Item = mongoose.model("Item", itemSchema);

module.exports = {
  Category,
  Item,
};
