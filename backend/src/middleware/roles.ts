import { Request, Response, NextFunction } from 'express';
import { UserRole } from './auth';
import { sendForbidden, sendUnauthorized } from '../utils/response';

/**
 * Middleware factory to restrict access by role(s)
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendForbidden(res, 'You do not have permission to perform this action');
      return;
    }

    next();
  };
}

export const superAdminOnly = authorize('SUPER_ADMIN');
export const committeeAdminOrAbove = authorize('SUPER_ADMIN', 'COMMITTEE_ADMIN');
export const committeeRoleOrAbove = authorize('SUPER_ADMIN', 'COMMITTEE_ADMIN', 'COMMITTEE_MEMBER');
export const anyAuthenticated = authorize('SUPER_ADMIN', 'COMMITTEE_ADMIN', 'COMMITTEE_MEMBER', 'USER');
