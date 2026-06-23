const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ status: 'fail', message: 'Please add all fields' });
  }

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ status: 'fail', message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
    });

    if (user) {
      res.status(201).json({
        status: 'success',
        data: {
          _id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          currency: user.currency,
          dateFormat: user.dateFormat,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400).json({ status: 'fail', message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: 'fail', message: 'Please provide email and password' });
  }

  try {
    // Check for user email (we need to explicitly select password because it's select: false in schema)
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        status: 'success',
        data: {
          _id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          currency: user.currency,
          dateFormat: user.dateFormat,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({ status: 'fail', message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: req.user, // provided by authMiddleware
  });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.avatar = req.body.avatar || user.avatar;
      user.currency = req.body.currency || user.currency;
      user.dateFormat = req.body.dateFormat || user.dateFormat;

      const updatedUser = await user.save();

      res.json({
        status: 'success',
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
          currency: updatedUser.currency,
          dateFormat: updatedUser.dateFormat,
          token: generateToken(updatedUser._id),
        },
      });
    } else {
      res.status(404).json({ status: 'fail', message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
};
