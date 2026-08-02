import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { query, queryOne } from '../config/database';
import { sendUnauthorized } from '../utils/response';

export type UserRole = 'SUPER_ADMIN' | 'COMMITTEE_ADMIN' | 'COMMITTEE_MEMBER' | 'USER';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
        name: string;
        phone: string;
        email: string | null;
      };
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res);
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user: any = await queryOne(
      'SELECT id, role, name, phone, email, isActive FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user || !user.isActive) {
      sendUnauthorized(res);
      return;
    }

    req.user = {
      userId: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      email: user.email,
    };

    next();
  } catch (error: any) {
    sendUnauthorized(res);
  }
}

/**
 * Optional authentication middleware
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user: any = await queryOne(
      'SELECT id, role, name, phone, email, isActive FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (user && user.isActive) {
      req.user = {
        userId: user.id,
        role: user.role,
        name: user.name,
        phone: user.phone,
        email: user.email,
      };
    }

    next();
  } catch {
    next();
  }
}
