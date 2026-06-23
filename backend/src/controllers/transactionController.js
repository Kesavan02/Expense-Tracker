const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

// @desc    Get all transactions for logged-in user
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .populate('category')
      .sort({ date: -1 });

    res.status(200).json({ status: 'success', data: transactions });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Add a transaction
// @route   POST /api/transactions
// @access  Private
const addTransaction = async (req, res) => {
  try {
    const { amount, type, category, description, date } = req.body;

    const transaction = await Transaction.create({
      user: req.user._id,
      amount,
      type,
      category,
      description,
      date,
    });

    const populated = await transaction.populate('category');

    res.status(201).json({ status: 'success', data: populated });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ status: 'fail', message: 'Transaction not found' });
    }

    // Ensure user owns the transaction
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized' });
    }

    await transaction.deleteOne();

    res.status(200).json({ status: 'success', data: {} });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = { getTransactions, addTransaction, deleteTransaction };
