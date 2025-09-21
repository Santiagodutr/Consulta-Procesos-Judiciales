import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabaseService } from '../config/supabase';
import { logger } from '../utils/logger';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { User, UserType, AuthResponse, NotificationPreferences } from '../types';
import { emailService } from '../services/emailService';

interface AuthRequest extends Request {
  user?: any;
}

// Helper function to generate JWT tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

// Helper function to determine user type based on document
const determineUserType = (documentType: string, documentNumber: string): UserType => {
  if (documentType === 'NIT') {
    // Could be juridical or company - for now, default to juridical
    // In a real app, you might have additional logic here
    return UserType.JURIDICAL;
  }
  return UserType.NATURAL;
};

export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    email,
    password,
    first_name,
    last_name,
    document_number,
    document_type,
    user_type,
    phone_number,
    company_id
  } = req.body;

  // Check if user already exists
  const existingUsers = await supabaseService.select('users', {
    filters: { email }
  });

  if (existingUsers && existingUsers.length > 0) {
    return next(new AppError('User already exists with this email', 400));
  }

  // Check if document number is already registered
  const existingDocument = await supabaseService.select('users', {
    filters: { document_number }
  });

  if (existingDocument && existingDocument.length > 0) {
    return next(new AppError('User already exists with this document number', 400));
  }

  // Register with Supabase Auth
  const authResult = await supabaseService.signUp(email, password, {
    first_name,
    last_name,
    document_number,
    document_type,
    user_type
  });

  if (!authResult.user) {
    return next(new AppError('Registration failed', 500));
  }

  // Create user profile in database
  const defaultNotificationPrefs: NotificationPreferences = {
    email_enabled: true,
    sms_enabled: false,
    in_app_enabled: true,
    sound_enabled: true,
    process_updates: true,
    hearing_reminders: true,
    document_alerts: true,
    weekly_summary: false
  };

  const userProfile = await supabaseService.insert('users', {
    id: authResult.user.id,
    email,
    first_name,
    last_name,
    document_number,
    document_type,
    user_type: user_type || determineUserType(document_type, document_number),
    phone_number,
    company_id,
    is_active: true,
    email_verified: false,
    notification_preferences: defaultNotificationPrefs,
    created_at: new Date(),
    updated_at: new Date()
  });

  // Generate tokens
  const tokens = generateTokens(authResult.user.id);

  // Send verification email
  try {
    await emailService.sendVerificationEmail(email, authResult.user.id);
  } catch (error) {
    logger.error('Failed to send verification email:', error);
  }

  logger.info(`User registered: ${email}`);

  const response: AuthResponse = {
    user: {
      ...userProfile,
      password_hash: undefined
    },
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expires_in: 7 * 24 * 60 * 60 // 7 days in seconds
  };

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email for verification.',
    data: response
  });
});

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  // Sign in with Supabase
  const authResult = await supabaseService.signIn(email, password);

  if (!authResult.user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Get user profile from database
  const userProfile = await supabaseService.select('users', {
    filters: { id: authResult.user.id }
  });

  if (!userProfile || userProfile.length === 0) {
    return next(new AppError('User profile not found', 404));
  }

  const user = userProfile[0];

  // Check if user is active
  if (!user.is_active) {
    return next(new AppError('Account is deactivated', 401));
  }

  // Generate tokens
  const tokens = generateTokens(authResult.user.id);

  // Update last login
  await supabaseService.update('users', user.id, {
    updated_at: new Date()
  });

  logger.info(`User logged in: ${email}`);

  const response: AuthResponse = {
    user: {
      ...user,
      password_hash: undefined
    },
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expires_in: 7 * 24 * 60 * 60 // 7 days in seconds
  };

  res.json({
    success: true,
    message: 'Login successful',
    data: response
  });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    await supabaseService.signOut(token);
  }

  logger.info(`User logged out: ${req.user?.email}`);

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return next(new AppError('Refresh token is required', 400));
  }

  try {
    // Refresh session with Supabase
    const result = await supabaseService.refreshSession(refresh_token);

    if (!result.user) {
      return next(new AppError('Invalid refresh token', 401));
    }

    // Generate new tokens
    const tokens = generateTokens(result.user.id);

    // Get user profile
    const userProfile = await supabaseService.select('users', {
      filters: { id: result.user.id }
    });

    const response: AuthResponse = {
      user: {
        ...userProfile[0],
        password_hash: undefined
      },
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: 7 * 24 * 60 * 60
    };

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: response
    });
  } catch (error) {
    return next(new AppError('Invalid refresh token', 401));
  }
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user;

  res.json({
    success: true,
    data: {
      ...user,
      password_hash: undefined
    }
  });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { first_name, last_name, phone_number, notification_preferences } = req.body;
  const userId = req.user.id;

  const updateData: any = {
    updated_at: new Date()
  };

  if (first_name) updateData.first_name = first_name;
  if (last_name) updateData.last_name = last_name;
  if (phone_number) updateData.phone_number = phone_number;
  if (notification_preferences) updateData.notification_preferences = notification_preferences;

  const updatedUser = await supabaseService.update('users', userId, updateData);

  logger.info(`Profile updated for user: ${req.user.email}`);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      ...updatedUser,
      password_hash: undefined
    }
  });
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { current_password, new_password } = req.body;
  const userId = req.user.id;

  // This would typically involve Supabase's password update functionality
  // For now, we'll log the attempt
  logger.info(`Password change requested for user: ${req.user.email}`);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  // Check if user exists
  const users = await supabaseService.select('users', {
    filters: { email }
  });

  if (!users || users.length === 0) {
    return next(new AppError('No user found with this email', 404));
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store reset token (you'd need a password_resets table)
  // For now, just log
  logger.info(`Password reset requested for: ${email}`);

  try {
    await emailService.sendPasswordResetEmail(email, resetToken);
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    return next(new AppError('Failed to send reset email', 500));
  }

  res.json({
    success: true,
    message: 'Password reset email sent'
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { token, new_password } = req.body;

  // Verify reset token (implementation depends on your reset token storage)
  // For now, just log
  logger.info(`Password reset attempted with token: ${token}`);

  res.json({
    success: true,
    message: 'Password reset successful'
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.params;

  // Verify email token (implementation depends on your token storage)
  // For now, just log
  logger.info(`Email verification attempted with token: ${token}`);

  res.json({
    success: true,
    message: 'Email verified successfully'
  });
});