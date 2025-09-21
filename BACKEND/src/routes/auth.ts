import { Router } from 'express';
const { body } = require('express-validator');
import { 
  register, 
  login, 
  logout, 
  refreshToken, 
  verifyEmail, 
  forgotPassword, 
  resetPassword,
  changePassword,
  getProfile,
  updateProfile
} from '../controllers/authController';
import { authenticate, requireEmailVerified } from '../middleware/auth';
import { authRateLimiterMiddleware } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Registration validation
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('first_name').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('last_name').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('document_number').trim().isLength({ min: 5 }).withMessage('Document number is required'),
  body('document_type').isIn(['CC', 'CE', 'NIT', 'passport']).withMessage('Valid document type is required'),
  body('user_type').isIn(['natural', 'juridical', 'company']).withMessage('Valid user type is required'),
  body('phone_number').optional().isMobilePhone('any').withMessage('Valid phone number required'),
];

// Login validation
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Change password validation
const changePasswordValidation = [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

// Reset password validation
const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

// Forgot password validation
const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
];

// Update profile validation
const updateProfileValidation = [
  body('first_name').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('last_name').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('phone_number').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  body('notification_preferences').optional().isObject().withMessage('Notification preferences must be an object'),
];

// Public routes (with rate limiting)
router.post('/register', authRateLimiterMiddleware, registerValidation, validateRequest, register);
router.post('/login', authRateLimiterMiddleware, loginValidation, validateRequest, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', authRateLimiterMiddleware, forgotPasswordValidation, validateRequest, forgotPassword);
router.post('/reset-password', authRateLimiterMiddleware, resetPasswordValidation, validateRequest, resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes (require authentication)
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfileValidation, validateRequest, updateProfile);
router.post('/change-password', authenticate, requireEmailVerified, changePasswordValidation, validateRequest, changePassword);

export default router;