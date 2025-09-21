import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getProcesses,
  getProcess,
  createProcess,
  updateProcess,
  deleteProcess,
  getProcessActivities,
  getProcessDocuments,
  shareProcess,
  unshareProcess,
  updateProcessMonitoring,
  scrapeProcessUpdates
} from '../controllers/processController';
import { authenticate, requireProcessAccess, requireEmailVerified } from '../middleware/auth';
import { validateRequest, validateObjectId, validatePagination } from '../middleware/validation';
import { scrapingRateLimiterMiddleware } from '../middleware/rateLimiter';

const router = Router();

// Validation schemas
const createProcessValidation = [
  body('process_number').trim().isLength({ min: 5 }).withMessage('Process number must be at least 5 characters'),
  body('court_name').trim().isLength({ min: 3 }).withMessage('Court name is required'),
  body('process_type').trim().isLength({ min: 3 }).withMessage('Process type is required'),
  body('subject_matter').trim().isLength({ min: 10 }).withMessage('Subject matter must be at least 10 characters'),
  body('plaintiff').trim().isLength({ min: 2 }).withMessage('Plaintiff name is required'),
  body('defendant').trim().isLength({ min: 2 }).withMessage('Defendant name is required'),
  body('role').isIn(['plaintiff', 'defendant', 'lawyer', 'observer']).withMessage('Valid role is required'),
];

const updateProcessValidation = [
  body('court_name').optional().trim().isLength({ min: 3 }).withMessage('Court name must be at least 3 characters'),
  body('process_type').optional().trim().isLength({ min: 3 }).withMessage('Process type must be at least 3 characters'),
  body('subject_matter').optional().trim().isLength({ min: 10 }).withMessage('Subject matter must be at least 10 characters'),
  body('plaintiff').optional().trim().isLength({ min: 2 }).withMessage('Plaintiff name must be at least 2 characters'),
  body('defendant').optional().trim().isLength({ min: 2 }).withMessage('Defendant name must be at least 2 characters'),
  body('status').optional().isIn(['active', 'inactive', 'closed', 'archived']).withMessage('Valid status required'),
];

const shareProcessValidation = [
  body('user_email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('role').isIn(['plaintiff', 'defendant', 'lawyer', 'observer']).withMessage('Valid role is required'),
  body('can_edit').optional().isBoolean().withMessage('can_edit must be boolean'),
];

// Public routes (no authentication required)
router.get('/search', validatePagination, getProcesses);

// Protected routes (require authentication)
router.use(authenticate);
router.use(requireEmailVerified);

// Process CRUD operations
router.get('/', validatePagination, getProcesses);
router.post('/', createProcessValidation, validateRequest, createProcess);
router.get('/:processId', validateObjectId('processId'), requireProcessAccess, getProcess);
router.put('/:processId', validateObjectId('processId'), requireProcessAccess, updateProcessValidation, validateRequest, updateProcess);
router.delete('/:processId', validateObjectId('processId'), requireProcessAccess, deleteProcess);

// Process activities and documents
router.get('/:processId/activities', validateObjectId('processId'), requireProcessAccess, validatePagination, getProcessActivities);
router.get('/:processId/documents', validateObjectId('processId'), requireProcessAccess, validatePagination, getProcessDocuments);

// Process sharing
router.post('/:processId/share', validateObjectId('processId'), requireProcessAccess, shareProcessValidation, validateRequest, shareProcess);
router.delete('/:processId/share/:userId', validateObjectId('processId'), validateObjectId('userId'), requireProcessAccess, unshareProcess);

// Process monitoring
router.patch('/:processId/monitoring', validateObjectId('processId'), requireProcessAccess, body('is_monitored').isBoolean(), validateRequest, updateProcessMonitoring);

// Scraping operations (with rate limiting)
router.post('/:processId/scrape', scrapingRateLimiterMiddleware, validateObjectId('processId'), requireProcessAccess, scrapeProcessUpdates);

export default router;