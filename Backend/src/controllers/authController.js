const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Cart = require('../models/Cart');
const logger = require('../utils/logger');

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET || 'dope-den-local-dev-secret';
  return jwt.sign({ userId, role }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const setAuthCookie = (res, token) => {
  res.cookie('dopeden_session', token, cookieOptions);
};

// Register new user
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Username, email, and password are required',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({
        statusCode: 409,
        message: 'Email or username already exists',
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
    });

    await user.save();

    // Create empty cart for new user
    const cart = new Cart({
      user: user._id,
      items: [],
    });
    await cart.save();

    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);

    res.status(201).json({
      statusCode: 201,
      message: 'User registered successfully',
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    logger.error(`Error during registration: ${error.message}`);
    res.status(500).json({
      statusCode: 500,
      message: 'Error during registration',
      error: error.message,
    });
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Email and password are required',
      });
    }

    // Find user and select password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);

    res.status(200).json({
      statusCode: 200,
      message: 'Login successful',
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    logger.error(`Error during login: ${error.message}`);
    res.status(500).json({
      statusCode: 500,
      message: 'Error during login',
      error: error.message,
    });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('dopeden_session', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return res.status(200).json({
    statusCode: 200,
    message: 'Logged out successfully',
  });
};
