/**
 * Admin-only middleware — verifies JWT AND role === 'admin'
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAdmin = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user || req.user.role !== 'admin') {
        return res
          .status(403)
          .json({ status: 'fail', message: 'Forbidden: admins only' });
      }

      next();
    } catch (error) {
      return res
        .status(401)
        .json({ status: 'fail', message: 'Not authorized, token failed' });
    }
  } else {
    return res
      .status(401)
      .json({ status: 'fail', message: 'Not authorized, no token' });
  }
};

module.exports = { requireAdmin };
