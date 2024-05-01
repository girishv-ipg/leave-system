const { Item, Category } = require("../models/menu"); // Import the Item, Category, and Restaurant models

// Create a new item within a category
const createItem = async (req, res) => {
  try {
    const { name, description, price, categoryId, restaurantId, itemType } =
      req.body;

    // Check if the category exists and belongs to the specified restaurant
    const category = await Category.findOne({
      _id: categoryId,
      restaurant: restaurantId,
    });

    if (!category) {
      return res.status(404).json({
        error: "Category not found or does not belong to the restaurant",
      });
    }

    // Create a new item
    const newItem = new Item({
      name,
      description,
      price,
      category: categoryId,
      restaurant: restaurantId,
      itemType,
    });

    // Save the item to the database
    const savedItem = await newItem.save();

    res.status(201).json({
      message: "Item created successfully",
      item: savedItem,
    });
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Import the Category and Menu models

// Fetch menus based on category and restaurant
const getMenusByCategoryAndRestaurant = async (req, res) => {
  try {
    const { categoryId, restaurantId } = req.params;

    // Check if the category exists and belongs to the specified restaurant
    const category = await Category.findOne({
      _id: categoryId,
      restaurant: restaurantId,
    });

    if (!category) {
      return res.status(404).json({
        error: "Category not found or does not belong to the restaurant",
      });
    }

    // Find all menus associated with the specified category and restaurant
    const menus = await Item.find({
      category: categoryId,
      restaurant: restaurantId,
    });

    res.status(200).json({
      message: "Menus fetched successfully",
      menus: menus,
    });
  } catch (error) {
    console.error("Error fetching menus:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// List all items
const listAllItems = async (req, res) => {
  try {
    // Find all items in the database
    const items = await Item.find();

    res.status(200).json({
      message: "Items fetched successfully",
      items: items,
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Search for items by name (e.g., "idli")
const searchItemsByName = async (req, res) => {
  try {
    const itemName = req.params.name; // Get the item name from the request parameters

    // Use a case-insensitive regex to find items with a matching name
    const items = await Item.find({
      name: { $regex: new RegExp(itemName, "i") },
    }).populate({
      path: "category",
      populate: {
        path: "restaurant",
        select: "name rating address", // Select only the 'name' field of the restaurant
      },
    });

    res.status(200).json({
      message: `Items with name "${itemName}" fetched successfully`,
      items: items,
    });
  } catch (error) {
    console.error("Error searching items by name:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createItem,
  getMenusByCategoryAndRestaurant,
  listAllItems,
  searchItemsByName,
};
