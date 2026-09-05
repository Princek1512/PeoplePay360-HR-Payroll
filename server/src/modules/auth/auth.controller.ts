import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { decryptPassword } from '../../utils/crypto.js';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        userRoles: {
          include: {
            role: true
          }
        },
        employee: {
          include: {
            department: true,
            jobPosition: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive user account.' });
    }

    const rawPassword = decryptPassword(password);
    const passwordValid = await bcrypt.compare(rawPassword, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const roles = user.userRoles.map((ur) => ur.role.name);

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roles
      },
      env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          employeeId: user.employeeId,
          roles,
          employee: user.employee
            ? {
                id: user.employee.id,
                name: user.employee.name,
                email: user.employee.email,
                avatarUrl: user.employee.avatarUrl,
                department: user.employee.department?.name,
                jobTitle: user.employee.jobPosition?.title
              }
            : null
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        userRoles: {
          include: {
            role: true
          }
        },
        employee: {
          include: {
            department: true,
            jobPosition: true,
            workingSchedule: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        employeeId: user.employeeId,
        roles: user.userRoles.map((ur) => ur.role.name),
        employee: user.employee
      }
    });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required.' });
    }

    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token or inactive account.' });
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const newToken = jwt.sign(
      { userId: user.id, email: user.email, roles },
      env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      success: true,
      data: { token: newToken }
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const rawCurrentPassword = decryptPassword(currentPassword);
    const isValid = await bcrypt.compare(rawCurrentPassword, user.passwordHash);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    const rawNewPassword = decryptPassword(newPassword);
    const newPasswordHash = await bcrypt.hash(rawNewPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    });

    return res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    next(err);
  }
};
