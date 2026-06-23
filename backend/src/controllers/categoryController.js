const Category = require('../models/Category');

// @desc    Get all categories (global + user's own)
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res) => {
  try {
    // Return global categories (no user) + the current user's categories
    const categories = await Category.find({
      $or: [{ user: req.user._id }, { user: null }, { user: { $exists: false } }],
    });

    res.status(200).json({ status: 'success', data: categories });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;

    const category = await Category.create({
      name,
      type,
      icon,
      color,
      user: req.user._id,
    });

    res.status(201).json({ status: 'success', data: category });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ status: 'fail', message: 'Category not found' });
    }

    // Only allow deletion of user-owned categories
    if (!category.user || category.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized to delete this category' });
    }

    await category.deleteOne();

    res.status(200).json({ status: 'success', data: {} });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = { getCategories, createCategory, deleteCategory };
