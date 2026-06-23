const express = require('express');
const router = express.Router();
const { getBudgets, createBudget, deleteBudget } = require('../controllers/budgetController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .get(getBudgets)
  .post(createBudget);

router.route('/:id')
  .delete(deleteBudget);

module.exports = router;
