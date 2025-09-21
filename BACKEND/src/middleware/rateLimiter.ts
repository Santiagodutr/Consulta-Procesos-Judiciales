import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { logger } from '../utils/logger';

// Create rate limiter instance
const rateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Number of requests
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000, // Per 15 minutes (in seconds)
});

// Stricter rate limiter for authentication endpoints
const authRateLimiter = new RateLimiterMemory({
  points: 5, // 5 attempts
  duration: 900, // Per 15 minutes
});

// Rate limiter for scraping endpoints (more restrictive)
const scrapingRateLimiter = new RateLimiterMemory({
  points: 10, // 10 scraping requests
  duration: 3600, // Per hour
});

export const rateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    await rateLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    const remainingPoints = rejRes?.remainingPoints || 0;
    const msBeforeNext = rejRes?.msBeforeNext || 0;

    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      remainingPoints,
      msBeforeNext,
      userAgent: req.get('User-Agent'),
    });

    res.set({
      'Retry-After': Math.round(msBeforeNext / 1000) || 1,
      'X-RateLimit-Limit': process.env.RATE_LIMIT_MAX_REQUESTS || '100',
      'X-RateLimit-Remaining': remainingPoints,
      'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext).toISOString(),
    });

    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: Math.round(msBeforeNext / 1000) || 1,
    });
  }
};

export const authRateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    await authRateLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    const msBeforeNext = rejRes?.msBeforeNext || 0;

    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`, {
      endpoint: req.path,
      userAgent: req.get('User-Agent'),
    });

    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: Math.round(msBeforeNext / 1000) || 1,
    });
  }
};

export const scrapingRateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || req.ip || req.connection.remoteAddress || 'unknown';
    await scrapingRateLimiter.consume(userId);
    next();
  } catch (rejRes: any) {
    const msBeforeNext = rejRes?.msBeforeNext || 0;

    logger.warn(`Scraping rate limit exceeded for user/IP: ${(req as any).user?.id || req.ip}`, {
      endpoint: req.path,
    });

    res.status(429).json({
      success: false,
      message: 'Scraping rate limit exceeded. Please try again later.',
      retryAfter: Math.round(msBeforeNext / 1000) || 1,
    });
  }
};

// Default export for general use
export { rateLimiterMiddleware as rateLimiter };