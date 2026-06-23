const User = require('../models/User');

// @desc    Get all users (admin)
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    res.status(200).json({ status: 'success', data: users });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Get user registration stats by time range
// @route   GET /api/admin/stats?range=weekly|monthly|yearly|all
// @access  Admin
const getUserStats = async (req, res) => {
  try {
    const range = req.query.range || 'monthly';

    const now = new Date();
    let groupFormat;
    let startDate;

    switch (range) {
      case 'weekly': {
        // Last 8 weeks — group by week number
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7 * 7);
        groupFormat = {
          year:  { $year: '$createdAt' },
          week:  { $week: '$createdAt' },
        };
        break;
      }
      case 'monthly': {
        // Last 12 months — group by month
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 11);
        groupFormat = {
          year:  { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        };
        break;
      }
      case 'yearly': {
        // All years — group by year
        startDate = new Date('2026-01-01');
        groupFormat = {
          year: { $year: '$createdAt' },
        };
        break;
      }
      default: {
        // all-time: group by month across all time
        startDate = new Date('2026-01-01');
        groupFormat = {
          year:  { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        };
        break;
      }
    }

    const pipeline = [
      { $match: { createdAt: { $gte: startDate }, role: 'user' } },
      {
        $group: {
          _id: groupFormat,
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } },
    ];

    const rawStats = await User.aggregate(pipeline);

    // Summary counts
    const weekAgo  = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
    const yearAgo  = new Date(now); yearAgo.setFullYear(now.getFullYear() - 1);

    const [totalCount, weekCount, monthCount, yearCount] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', createdAt: { $gte: weekAgo } }),
      User.countDocuments({ role: 'user', createdAt: { $gte: monthAgo } }),
      User.countDocuments({ role: 'user', createdAt: { $gte: yearAgo } }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        summary: { total: totalCount, thisWeek: weekCount, thisMonth: monthCount, thisYear: yearCount },
        chart: rawStats,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Delete a user (admin)
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ status: 'fail', message: 'Cannot delete an admin account' });
    }
    await user.deleteOne();
    res.status(200).json({ status: 'success', data: {} });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = { getAllUsers, getUserStats, deleteUser };
