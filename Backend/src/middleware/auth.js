const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const bearerToken = header.startsWith('Bearer ') ? header.slice(7) : null;
    const cookieToken = req.cookies?.dopeden_session;
    const token = bearerToken || cookieToken;

    if (!token) {
      return res.status(401).json({
        statusCode: 401,
        message: 'No token provided. Please authenticate.',
      });
    }

    const secret = process.env.JWT_SECRET || 'dope-den-local-dev-secret';
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    return res.status(401).json({
      statusCode: 401,
      message: 'Invalid or expired token.',
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      statusCode: 403,
      message: 'Access denied. Admin privileges required.',
    });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
