import { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendCreated, sendError } from '../../utils/response';

export class AuthController {
  /**
   * POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.register(req.body);
      sendCreated(res, result, 'Registration successful');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, 'Login successful');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * POST /api/auth/refresh
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      sendSuccess(res, result, 'Token refreshed');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { phone, newPassword } = req.body;
      await authService.resetPassword(phone, newPassword);
      sendSuccess(res, null, 'Password reset successful');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/auth/me
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = await authService.getProfile(req.user!.userId);
      sendSuccess(res, user);
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * PUT /api/auth/profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = await authService.updateProfile(req.user!.userId, req.body);
      sendSuccess(res, user, 'Profile updated');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * POST /api/auth/change-password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user!.userId, currentPassword, newPassword);
      sendSuccess(res, null, 'Password updated successfully');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
  
  public async updatePushToken(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { token } = req.body;

      if (!token) {
        sendError(res, 'Token is required', 400);
        return;
      }

      await authService.updatePushToken(userId, token);
      sendSuccess(res, null, 'Push token updated successfully');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
}

export const authController = new AuthController();
