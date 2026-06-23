const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a category name'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Please specify if this is an income or expense category'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // If user is null, it can be considered a "default" global category
      required: false, 
    },
    icon: {
      type: String,
      default: 'default_icon',
    },
    color: {
      type: String,
      default: '#000000',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Category', categorySchema);
