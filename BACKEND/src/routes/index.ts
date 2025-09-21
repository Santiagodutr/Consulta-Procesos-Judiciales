import { Router } from 'express';
import authRoutes from './auth';
import judicialRoutes from './judicial';
// import processRoutes from './processes';
// import userRoutes from './users';
// import companyRoutes from './companies';
// import notificationRoutes from './notifications';
// import scrapingRoutes from './scraping';
// import analyticsRoutes from './analytics';
// import documentRoutes from './documents';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/judicial', judicialRoutes);
// router.use('/processes', processRoutes);
// router.use('/users', userRoutes);
// router.use('/companies', companyRoutes);
// router.use('/notifications', notificationRoutes);
// router.use('/scraping', scrapingRoutes);
// router.use('/analytics', analyticsRoutes);
// router.use('/documents', documentRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Judicial Processes Consultation API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      judicial: '/api/judicial',
      users: '/api/users',
      processes: '/api/processes',
      companies: '/api/companies',
      notifications: '/api/notifications',
      scraping: '/api/scraping',
      analytics: '/api/analytics',
      documents: '/api/documents'
    }
  });
});

export default router;