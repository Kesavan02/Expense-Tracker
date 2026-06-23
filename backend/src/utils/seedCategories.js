/**
 * Seed script - populates default categories in MongoDB
 * Run: node backend/src/utils/seedCategories.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = require('../config/db');
const Category = require('../models/Category');

const defaultCategories = [
  // Expense categories
  { name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#FF6B6B' },
  { name: 'Transport', type: 'expense', icon: '🚗', color: '#4ECDC4' },
  { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#45B7D1' },
  { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#96CEB4' },
  { name: 'Health', type: 'expense', icon: '💊', color: '#FFEAA7' },
  { name: 'Utilities', type: 'expense', icon: '💡', color: '#DDA0DD' },
  { name: 'Education', type: 'expense', icon: '📚', color: '#98D8C8' },
  { name: 'Other', type: 'expense', icon: '📦', color: '#ADB5BD' },
  // Income categories
  { name: 'Salary', type: 'income', icon: '💼', color: '#2ECC71' },
  { name: 'Freelance', type: 'income', icon: '💻', color: '#27AE60' },
  { name: 'Investment', type: 'income', icon: '📈', color: '#1ABC9C' },
  { name: 'Gift', type: 'income', icon: '🎁', color: '#F39C12' },
  { name: 'Other Income', type: 'income', icon: '💰', color: '#16A085' },
];

const seed = async () => {
  await connectDB();

  // Only insert categories that don't already exist (by name + type + no user)
  for (const cat of defaultCategories) {
    const exists = await Category.findOne({ name: cat.name, type: cat.type, user: null });
    if (!exists) {
      await Category.create({ ...cat, user: null });
      console.log(`✅ Created: ${cat.icon} ${cat.name}`);
    } else {
      console.log(`⏭️  Exists: ${cat.name}`);
    }
  }

  console.log('\nSeeding complete.');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
