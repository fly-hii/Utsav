import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  updateProfileSchema,
  sendOtpSchema,
  loginWithOtpSchema,
  resetPasswordWithOtpSchema,
} from './auth.validator';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/send-otp', validate(sendOtpSchema), authController.sendOtp);
router.post('/login-with-otp', validate(loginWithOtpSchema), authController.loginWithOtp);
router.post('/reset-password-with-otp', validate(resetPasswordWithOtpSchema), authController.resetPasswordWithOtp);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/push-token', authenticate, authController.updatePushToken);

export default router;
