const Order = require("../models/order");
const { Item } = require("../models/menu");
const User = require("../models/user");

// Create a new order with total calculation
const createOrder = async (req, res) => {
  try {
    const {
      items,
      userId,
      address,
      instructions,
      paymentMethod,
      restaurantId,
    } = req.body;

    // Calculate the total based on the selected items and their quantities
    let total = 0;

    for (const item of items) {
      const itemDetails = await Item.findById(item.item);
      if (!itemDetails) {
        return res.status(404).json({ error: "Item not found" });
      }

      total += itemDetails.price * item.quantity;
    }

    // Create a new order
    const newOrder = new Order({
      items,
      user: userId,
      total,
      orderStatus: "Pending", // Set the initial order status to 'Pending'
      paymentStatus: "Pending", // Set the initial payment status to 'Pending'
      paymentMethod,
      address,
      instructions,
      restaurant: restaurantId,
    });

    // Save the order to the database
    const savedOrder = await newOrder.save();

    res.status(201).json({
      message: "Order created successfully",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Fetch all orders for the restaurant belonging to the logged-in user
const getOrdersForUserRestaurant = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the ID of the logged-in user (assuming you have user authentication)

    // Find the user's restaurant by querying the User model
    const user = await User.findById(userId).populate("restaurant");

    if (!user || !user.restaurant) {
      return res.status(404).json({ error: "User or restaurant not found" });
    }

    const restaurantId = user.restaurant._id;

    // Find orders where the restaurant field matches the restaurantId
    const orders = await Order.find({ restaurant: restaurantId });

    res.status(200).json({
      message: "Orders for the user's restaurant fetched successfully",
      orders: orders,
    });
  } catch (error) {
    console.error("Error fetching orders for the user's restaurant:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createOrder,
  getOrdersForUserRestaurant,
};
