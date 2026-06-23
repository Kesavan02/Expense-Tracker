const express = require('express');
const router = express.Router();
const {
  getTransactions,
  addTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getTransactions);
router.post('/', protect, addTransaction);
router.delete('/:id', protect, deleteTransaction);

module.exports = router;
