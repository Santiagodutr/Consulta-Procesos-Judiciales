import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from './errorHandler';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return next(new AppError(`Validation failed: ${errorMessages.join(', ')}`, 400));
  }
  
  next();
};

export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    
    // UUID validation pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidPattern.test(id)) {
      return next(new AppError(`Invalid ${paramName} format`, 400));
    }
    
    next();
  };
};

export const validateDocumentType = (req: Request, res: Response, next: NextFunction) => {
  const { document_type, document_number, user_type } = req.body;
  
  // Define validation rules for different document types
  const documentRules = {
    CC: {
      pattern: /^\d{6,10}$/,
      message: 'Cedula de Ciudadania must be 6-10 digits',
      validUserTypes: ['natural']
    },
    CE: {
      pattern: /^\d{6,10}$/,
      message: 'Cedula de Extranjeria must be 6-10 digits',
      validUserTypes: ['natural']
    },
    NIT: {
      pattern: /^\d{9,15}(-\d)?$/,
      message: 'NIT must be 9-15 digits, optionally followed by -digit',
      validUserTypes: ['juridical', 'company']
    },
    passport: {
      pattern: /^[A-Z0-9]{6,12}$/,
      message: 'Passport must be 6-12 alphanumeric characters',
      validUserTypes: ['natural']
    }
  };
  
  const rule = documentRules[document_type as keyof typeof documentRules];
  
  if (!rule) {
    return next(new AppError('Invalid document type', 400));
  }
  
  if (!rule.pattern.test(document_number)) {
    return next(new AppError(rule.message, 400));
  }
  
  if (!rule.validUserTypes.includes(user_type)) {
    return next(new AppError(`Document type ${document_type} is not valid for user type ${user_type}`, 400));
  }
  
  next();
};

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove potentially dangerous characters from string fields
  const sanitizeString = (str: string): string => {
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+=/gi, '');
  };
  
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };
  
  req.body = sanitizeObject(req.body);
  next();
};

export const validateFileUpload = (allowedTypes: string[], maxSize: number = 10485760) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const file = (req as any).file;
    
    if (!file) {
      return next();
    }
    
    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      return next(new AppError(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`, 400));
    }
    
    // Check file size
    if (file.size > maxSize) {
      return next(new AppError(`File too large. Maximum size: ${maxSize / 1024 / 1024}MB`, 400));
    }
    
    next();
  };
};

export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  if (page < 1) {
    return next(new AppError('Page must be greater than 0', 400));
  }
  
  if (limit < 1 || limit > 100) {
    return next(new AppError('Limit must be between 1 and 100', 400));
  }
  
  req.query.page = page.toString();
  req.query.limit = limit.toString();
  
  next();
};