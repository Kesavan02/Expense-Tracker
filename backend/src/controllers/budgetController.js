const Budget = require('../models/Budget');

// @desc    Get all budgets for current user
// @route   GET /api/budgets
// @access  Private
exports.getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id }).populate('category');

    res.status(200).json({
      success: true,
      data: budgets,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// @desc    Create new budget
// @route   POST /api/budgets
// @access  Private
exports.createBudget = async (req, res) => {
  try {
    req.body.user = req.user.id;
    
    // Check if category etc is valid
    const budget = await Budget.create(req.body);

    const populatedBudget = await Budget.findById(budget._id).populate('category');

    res.status(201).json({
      success: true,
      data: populatedBudget,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        error: messages,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server Error',
      });
    }
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        error: 'No budget found',
      });
    }

    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized',
      });
    }

    await budget.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};
