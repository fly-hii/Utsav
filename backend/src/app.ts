import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Import Routes
import authRoutes from './modules/auth/auth.routes';
import committeeRoutes from './modules/committee/committee.routes';
import memberRoutes from './modules/member/member.routes';
import eventRoutes, { eventStandaloneRouter } from './modules/event/event.routes';
import donationRoutes, { donationStandaloneRouter } from './modules/donation/donation.routes';
import expenseRoutes, { expenseStandaloneRouter } from './modules/expense/expense.routes';
import reelRoutes from './modules/reel/reel.routes';
import galleryRoutes, { galleryStandaloneRouter } from './modules/gallery/gallery.routes';
import notificationRoutes from './modules/notification/notification.routes';
import reportRoutes from './modules/report/report.routes';
import adminRoutes from './modules/admin/admin.routes';
import uploadRoutes from './modules/upload/upload.routes';

export function createApp(): Express {
  const app = express();

  // Security & Utility Middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: true, // Allow all origins for dev/mobile app access
      credentials: true,
    })
  );
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health Check
  app.get(['/health', '/api/health'], (_req, res) => {
    res.status(200).json({ status: 'OK', message: 'Utsav API is running smoothly 🎪', timestamp: new Date() });
  });

  // API Routes
  app.use(['/api/auth', '/auth'], authRoutes);
  app.use(['/api/committees', '/committees'], committeeRoutes);

  // Nested Committee Sub-resources
  app.use(['/api/committees/:id/members', '/committees/:id/members'], memberRoutes);
  app.use(['/api/committees/:id/events', '/committees/:id/events'], eventRoutes);
  app.use(['/api/committees/:id/donations', '/committees/:id/donations'], donationRoutes);
  app.use(['/api/committees/:id/expenses', '/committees/:id/expenses'], expenseRoutes);
  app.use(['/api/committees/:id/gallery', '/committees/:id/gallery'], galleryRoutes);

  // Standalone Resources
  app.use(['/api/events', '/events'], eventStandaloneRouter);
  app.use(['/api/donations', '/donations'], donationStandaloneRouter);
  app.use(['/api/expenses', '/expenses'], expenseStandaloneRouter);
  app.use(['/api/gallery', '/gallery'], galleryStandaloneRouter);
  app.use(['/api/reels', '/reels'], reelRoutes);
  app.use(['/api/notifications', '/notifications'], notificationRoutes);
  app.use(['/api/reports', '/reports'], reportRoutes);
  app.use(['/api/admin', '/admin'], adminRoutes);
  app.use(['/api/upload', '/upload'], uploadRoutes);

  // 444 / 404 Route Handler
  app.use('*', (_req, res) => {
    res.status(404).json({ success: false, message: 'API route not found' });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
