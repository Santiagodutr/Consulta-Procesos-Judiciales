import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseService } from '../config/supabase';
import { logger } from '../utils/logger';
import { AppError } from './errorHandler';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Access token is required', 401));
    }

    // Verify token with Supabase
    const user = await supabaseService.getUser(token);
    
    if (!user) {
      return next(new AppError('Invalid token', 401));
    }

    // Get full user profile from database
    const userProfile = await supabaseService.select('users', {
      filters: { id: user.id }
    });

    if (!userProfile || userProfile.length === 0) {
      return next(new AppError('User not found', 401));
    }

    // Check if user is active
    if (!userProfile[0].is_active) {
      return next(new AppError('Account is deactivated', 401));
    }

    // Add user to request object
    req.user = {
      ...user,
      ...userProfile[0]
    };

    next();
  } catch (error: any) {
    logger.error('Authentication error:', error);
    return next(new AppError('Authentication failed', 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.user_type)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const user = await supabaseService.getUser(token);
        
        if (user) {
          const userProfile = await supabaseService.select('users', {
            filters: { id: user.id }
          });

          if (userProfile && userProfile.length > 0 && userProfile[0].is_active) {
            req.user = {
              ...user,
              ...userProfile[0]
            };
          }
        }
      } catch (error) {
        // Ignore authentication errors for optional auth
        logger.debug('Optional auth failed:', error);
      }
    }

    next();
  } catch (error: any) {
    logger.error('Optional authentication error:', error);
    next();
  }
};

export const requireEmailVerified = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (!req.user.email_verified) {
    return next(new AppError('Email verification required', 403));
  }

  next();
};

export const requireCompanyAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const { companyId } = req.params;
    
    if (!companyId) {
      return next(new AppError('Company ID is required', 400));
    }

    // Check if user belongs to the company
    if (req.user.company_id !== companyId) {
      return next(new AppError('Access denied to this company', 403));
    }

    // Get company info
    const company = await supabaseService.select('companies', {
      filters: { id: companyId }
    });

    if (!company || company.length === 0) {
      return next(new AppError('Company not found', 404));
    }

    if (!company[0].is_active) {
      return next(new AppError('Company is inactive', 403));
    }

    req.user.company = company[0];
    next();
  } catch (error: any) {
    logger.error('Company access check error:', error);
    return next(new AppError('Failed to verify company access', 500));
  }
};

export const requireProcessAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const { processId } = req.params;
    
    if (!processId) {
      return next(new AppError('Process ID is required', 400));
    }

    // Check if user has access to the process
    const userProcess = await supabaseService.select('user_processes', {
      filters: { 
        user_id: req.user.id,
        process_id: processId
      }
    });

    if (!userProcess || userProcess.length === 0) {
      return next(new AppError('Access denied to this process', 403));
    }

    req.user.processAccess = userProcess[0];
    next();
  } catch (error: any) {
    logger.error('Process access check error:', error);
    return next(new AppError('Failed to verify process access', 500));
  }
};