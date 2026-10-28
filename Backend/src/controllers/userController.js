const User = require('../models/User');
const logger = require('../utils/logger');

// Get user profile
exports.getUserProfile = async (req, res, next) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: 'User not found',
      });
    }

    res.status(200).json({
      statusCode: 200,
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error(`Error fetching user profile: ${error.message}`);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching user profile',
      error: error.message,
    });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { username, email } = req.body;

    // Validate input
    if (!username && !email) {
      return res.status(400).json({
        statusCode: 400,
        message: 'At least one field is required for update',
      });
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: 'User not found',
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: 'User profile updated successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error(`Error updating user profile: ${error.message}`);
    res.status(500).json({
      statusCode: 500,
      message: 'Error updating user profile',
      error: error.message,
    });
  }
};
