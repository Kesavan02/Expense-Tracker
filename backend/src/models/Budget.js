const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please select a category for the budget'],
    },
    amount: {
      type: Number,
      required: [true, 'Please add a budget amount'],
    },
    startDate: {
      type: Date,
      required: [true, 'Please add a start date manually or default'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please add an end date manually or default'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Budget', budgetSchema);
