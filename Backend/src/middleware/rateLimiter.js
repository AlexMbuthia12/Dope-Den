const { RateLimiterMemory } = require('rate-limiter-flexible');

// Token Bucket Configuration:
// points: 3 (Max capacity: 3 tokens in the bucket)
// duration: 3 (Refills 1 token every 3 seconds / or resets bucket every window)
// 1 token allows 1 batch query of up to 69 items
const productBatchLimiter = new RateLimiterMemory({
  points: 3, 
  duration: 3, // 3 batch queries allowed per three seconds
  blockDuration: 10, // Block for 10 seconds if bucket is exhausted
});

const limitProductBatches = async (req, res, next) => {
  // Unique Identity Resolution
  // Prefers user ID if logged in; falls back to client IP address
  const clientIdentity = req.user && (req.user.id || req.user._id)
    ? `user_${req.user.id || req.user._id}`
    : `ip_${req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress}`;

  try {
    // Consume 1 token from the user's bucket
    const rateLimiterRes = await productBatchLimiter.consume(clientIdentity);

    // Set rate limit headers so frontend can inspect remaining tokens
    res.setHeader('X-RateLimit-Limit', 3);
    res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());

    next();
  } catch (rejRes) {
    // Token bucket empty!
    res.setHeader('Retry-After', Math.round(rejRes.msBeforeNext / 1000) || 1);
    
    return res.status(429).json({
      statusCode: 429,
      message: 'Too many catalog requests. You have reached your browsing batch limit. Please wait a moment before loading more products.',
      retryAfterSeconds: Math.round(rejRes.msBeforeNext / 1000) || 1,
    });
  }
};

module.exports = { limitProductBatches };