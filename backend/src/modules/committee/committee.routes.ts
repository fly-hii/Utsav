import { Router } from 'express';
import { committeeController } from './committee.controller';
import { authenticate, optionalAuth } from '../../middleware/auth';
import { committeeRoleOrAbove } from '../../middleware/roles';
import { uploadMixed, uploadSingle } from '../../middleware/upload';

const router = Router();

// Public routes
router.get('/', committeeController.list);
router.get('/nearby', committeeController.nearby);
router.get('/:id/profile', committeeController.getProfile);

// Committee registration (multipart form data)
router.post(
  '/register',
  uploadMixed.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'templeImages', maxCount: 5 },
    { name: 'registrationCert', maxCount: 1 },
    { name: 'identityProof', maxCount: 1 },
  ]),
  committeeController.register
);

// Protected routes
router.get('/:id', authenticate, committeeController.getById);
router.put('/:id', authenticate, committeeController.update);
router.put('/:id/qrcode', authenticate, committeeRoleOrAbove, uploadSingle, committeeController.uploadQRCode);
router.get('/:id/dashboard', authenticate, committeeRoleOrAbove, committeeController.dashboard);

export default router;
