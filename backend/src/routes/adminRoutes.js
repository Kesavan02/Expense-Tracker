const express = require('express');
const router = express.Router();
const { getAllUsers, getUserStats, deleteUser } = require('../controllers/adminController');
const { getAllCategories, createGlobalCategory, deleteAnyCategory } = require('../controllers/adminCategoryController');
const { requireAdmin } = require('../middlewares/adminMiddleware');

// User management
router.get('/users', requireAdmin, getAllUsers);
router.get('/stats', requireAdmin, getUserStats);
router.delete('/users/:id', requireAdmin, deleteUser);

// Category management (admin creates global categories visible to all users)
router.get('/categories', requireAdmin, getAllCategories);
router.post('/categories', requireAdmin, createGlobalCategory);
router.delete('/categories/:id', requireAdmin, deleteAnyCategory);

module.exports = router;
