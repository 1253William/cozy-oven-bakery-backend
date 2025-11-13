import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// General API limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests — please try again in 15 minutes.",
    });
  },
});


// Strict limiter for login/signup
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  limit: 5, // only 5 attempts in 10 min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many login attempts, try again later.",
    });
  },
});

//Image upload rate limiter



const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 min
  delayAfter: 100, // allow 100 requests per 15 min, then...
  delayMs: () => 500, // add 500ms delay per request above that
});

// Apply to all requests
//app.use("/api", dynamicLimiter);
// app.use("/api", apiLimiter);
// // Apply stricter limit to auth routes
// app.use("/api/v1/auth/login", authLimiter);
// app.use("/api/v1/auth/register", authLimiter);
//app.use("/api", speedLimiter);
