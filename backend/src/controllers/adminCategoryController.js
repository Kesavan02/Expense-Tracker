const Category = require('../models/Category');

// @desc    Get all categories (admin view — all categories in DB)
// @route   GET /api/admin/categories
// @access  Admin
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ type: 1, name: 1 });
    res.status(200).json({ status: 'success', data: categories });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Create a global/system category (visible to all users)
// @route   POST /api/admin/categories
// @access  Admin
const createGlobalCategory = async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;

    const category = await Category.create({
      name,
      type,
      icon: icon || 'category',
      color: color || '#000000',
      user: null, // null = global, visible to everyone
    });

    res.status(201).json({ status: 'success', data: category });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// @desc    Delete any category (admin can delete global or user categories)
// @route   DELETE /api/admin/categories/:id
// @access  Admin
const deleteAnyCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ status: 'fail', message: 'Category not found' });
    }

    await category.deleteOne();

    res.status(200).json({ status: 'success', data: {} });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = { getAllCategories, createGlobalCategory, deleteAnyCategory };
