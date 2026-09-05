import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db.js';

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, role, status } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: String(search), mode: 'insensitive' } },
        { employee: { name: { contains: String(search), mode: 'insensitive' } } }
      ];
    }
    if (status) {
      where.isActive = status === 'active';
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            department: { select: { id: true, name: true } },
            jobPosition: { select: { id: true, title: true } }
          }
        },
        userRoles: {
          include: {
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    let filtered = users;
    if (role) {
      filtered = users.filter((u) => u.userRoles.some((ur) => ur.role.name === role));
    }

    return res.json({
      success: true,
      data: filtered.map((u) => ({
        id: u.id,
        email: u.email,
        isActive: u.isActive,
        createdAt: u.createdAt,
        employee: u.employee,
        roles: u.userRoles.map((ur) => ur.role.name)
      }))
    });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, employeeId, roles, isActive = true } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
    }

    if (employeeId) {
      const linked = await prisma.user.findUnique({
        where: { employeeId }
      });
      if (linked) {
        return res.status(409).json({ success: false, message: 'This employee is already linked to another user account.' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Resolve roles
    const roleNames: string[] = Array.isArray(roles) && roles.length > 0 ? roles : ['Employee'];
    const dbRoles = await prisma.role.findMany({
      where: { name: { in: roleNames } }
    });

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        isActive: Boolean(isActive),
        employeeId: employeeId || null,
        userRoles: {
          create: dbRoles.map((r) => ({
            roleId: r.id
          }))
        }
      },
      include: {
        employee: true,
        userRoles: { include: { role: true } }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: {
        id: newUser.id,
        email: newUser.email,
        isActive: newUser.isActive,
        employee: newUser.employee,
        roles: newUser.userRoles.map((ur) => ur.role.name)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateUserRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { roles, isActive } = req.body;

    // Self-elevation prevention: Users cannot change their own roles unless another admin exists
    if (req.user?.id === id && roles) {
      return res.status(403).json({ success: false, message: 'Users are forbidden from modifying their own roles.' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { userRoles: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (Array.isArray(roles)) {
      const dbRoles = await prisma.role.findMany({
        where: { name: { in: roles } }
      });

      // Transactionally replace user roles
      await prisma.$transaction([
        prisma.userRole.deleteMany({ where: { userId: id } }),
        prisma.userRole.createMany({
          data: dbRoles.map((r) => ({
            userId: id,
            roleId: r.id
          }))
        })
      ]);
    }

    if (typeof isActive === 'boolean') {
      await prisma.user.update({
        where: { id },
        data: { isActive }
      });
    }

    const updated = await prisma.user.findUnique({
      where: { id },
      include: {
        employee: true,
        userRoles: { include: { role: true } }
      }
    });

    return res.json({
      success: true,
      message: 'User updated successfully.',
      data: {
        id: updated?.id,
        email: updated?.email,
        isActive: updated?.isActive,
        employee: updated?.employee,
        roles: updated?.userRoles.map((ur) => ur.role.name)
      }
    });
  } catch (err) {
    next(err);
  }
};
