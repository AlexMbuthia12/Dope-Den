const logger = require('../utils/logger');

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`${statusCode} - ${message}`);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      statusCode: 400,
      message: 'Validation failed',
      errors,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      statusCode: 409,
      message: `${field} already exists`,
    });
  }

  res.status(statusCode).json({
    statusCode,
    message,
  });
};

module.exports = { ApiError, errorHandler };
