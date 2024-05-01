const { Category } = require('../models/menu'); // Import the Category model
const Restaurant = require('../models/resturant');

// Create a new category
const createCategory = async (req, res) => {
  try {
    const { name, description, restaurantId } = req.body;

    // Check if the restaurantId exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Create a new category
    const newCategory = new Category({
      name,
      description,
      restaurant: restaurantId,
    });

    // Save the category to the database
    const savedCategory = await newCategory.save();

    res.status(201).json({
      message: 'Category created successfully',
      category: savedCategory,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const getCategoriesByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;


    const categories = await Category.find({ restaurant: restaurantId })
    .populate('restaurant', 'name');

    res.status(200).json({
      message: 'Categories fetched successfully',
      categories: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a category
const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description } = req.body;

    // Check if the category exists
    const category = await Category.findByIdAndUpdate(
      categoryId,
      { name, description },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(200).json({
      message: 'Category updated successfully',
      category: category,
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a category
const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Check if the category exists and delete it
    const deletedCategory = await Category.findByIdAndDelete(categoryId);

    if (!deletedCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(200).json({
      message: 'Category deleted successfully',
      category: deletedCategory,
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createCategory,
  getCategoriesByRestaurant,
  updateCategory,
  deleteCategory,
};
