import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 1000, // 
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for login/signup
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 5, // only 5 attempts in 10 min
  message: "Too many login attempts, try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

//Image upload rate limiter



const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 min
  delayAfter: 100, // allow 100 requests per 15 min, then...
  delayMs: 500, // add 500ms delay per request above that
});

// Apply to all requests
//app.use("/api", dynamicLimiter);
// app.use("/api", apiLimiter);
// // Apply stricter limit to auth routes
// app.use("/api/v1/auth/login", authLimiter);
// app.use("/api/v1/auth/register", authLimiter);
//app.use("/api", speedLimiter);
