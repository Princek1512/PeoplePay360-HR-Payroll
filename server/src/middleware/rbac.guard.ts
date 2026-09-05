import { Request, Response, NextFunction } from 'express';
import { PermissionAction, hasPermission, UserRoleType } from '../shared/types/roles.enum.js';

export const requirePermission = (module: string, action: PermissionAction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Authentication required.' });
    }

    // Admins have bypass for everything
    if (req.user.roles.includes(UserRoleType.ADMIN)) {
      return next();
    }

    const permitted = hasPermission(req.user.roles, module, action);
    if (!permitted) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. You lack '${action}' permission on '${module}'. Required roles: HR / Payroll / Admin.`
      });
    }

    next();
  };
};

export const requireRoles = (...allowedRoles: (UserRoleType | string)[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Authentication required.' });
    }

    if (req.user.roles.includes(UserRoleType.ADMIN)) {
      return next();
    }

    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. This operation requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};
