import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';

// --- Salary Structures ---
export const listStructures = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const structures = await prisma.salaryStructure.findMany({
      include: {
        salaryStructureRules: {
          include: { rule: true },
          orderBy: { sequence: 'asc' }
        },
        _count: {
          select: {
            contracts: true,
            payruns: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return res.json({
      success: true,
      data: structures.map((s) => ({
        id: s.id,
        name: s.name,
        isActive: s.isActive,
        rulesCount: s.salaryStructureRules.length,
        employeesCount: s._count.contracts,
        rules: s.salaryStructureRules.map((sr) => ({
          id: sr.rule.id,
          name: sr.rule.name,
          code: sr.rule.code,
          category: sr.rule.category,
          sequence: sr.sequence,
          computationMethod: sr.rule.computationMethod,
          amount: sr.rule.amount ? Number(sr.rule.amount) : null,
          percentageOf: sr.rule.percentageOf,
          formula: sr.rule.formula
        }))
      }))
    });
  } catch (err) {
    next(err);
  }
};

export const getStructureById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const structure = await prisma.salaryStructure.findUnique({
      where: { id },
      include: {
        salaryStructureRules: {
          include: { rule: true },
          orderBy: { sequence: 'asc' }
        },
        _count: {
          select: { contracts: true }
        }
      }
    });

    if (!structure) {
      return res.status(404).json({ success: false, message: 'Salary structure not found.' });
    }

    return res.json({
      success: true,
      data: {
        id: structure.id,
        name: structure.name,
        isActive: structure.isActive,
        employeesCount: structure._count.contracts,
        rules: structure.salaryStructureRules.map((sr) => ({
          ...sr.rule,
          sequence: sr.sequence,
          amount: sr.rule.amount ? Number(sr.rule.amount) : null
        }))
      }
    });
  } catch (err) {
    next(err);
  }
};

export const createStructure = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, isActive = true, ruleIds = [] } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Structure name is required.' });
    }

    const structure = await prisma.salaryStructure.create({
      data: {
        name,
        isActive,
        salaryStructureRules: {
          create: ruleIds.map((ruleId: string, index: number) => ({
            ruleId,
            sequence: (index + 1) * 10
          }))
        }
      },
      include: {
        salaryStructureRules: {
          include: { rule: true },
          orderBy: { sequence: 'asc' }
        }
      }
    });

    return res.status(201).json({ success: true, message: 'Salary structure created.', data: structure });
  } catch (err) {
    next(err);
  }
};

export const updateStructure = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, isActive, ruleAssignments } = req.body;
    // ruleAssignments: Array<{ ruleId: string, sequence: number }>

    const updated = await prisma.$transaction(async (tx) => {
      if (Array.isArray(ruleAssignments)) {
        await tx.salaryStructureRule.deleteMany({ where: { structureId: id } });
        await tx.salaryStructureRule.createMany({
          data: ruleAssignments.map((ra: any, idx: number) => ({
            structureId: id,
            ruleId: ra.ruleId,
            sequence: ra.sequence !== undefined ? Number(ra.sequence) : (idx + 1) * 10
          }))
        });
      }

      return tx.salaryStructure.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(isActive !== undefined && { isActive })
        },
        include: {
          salaryStructureRules: {
            include: { rule: true },
            orderBy: { sequence: 'asc' }
          }
        }
      });
    });

    return res.json({ success: true, message: 'Salary structure updated.', data: updated });
  } catch (err) {
    next(err);
  }
};

// --- Salary Rules ---
export const listRules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rules = await prisma.salaryRule.findMany({
      orderBy: { sequence: 'asc' }
    });
    return res.json({
      success: true,
      data: rules.map((r) => ({
        ...r,
        amount: r.amount ? Number(r.amount) : null
      }))
    });
  } catch (err) {
    next(err);
  }
};

export const createRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code, category, sequence = 10, computationMethod, amount, percentageOf, formula } = req.body;

    if (!name || !code || !category || !computationMethod) {
      return res.status(400).json({
        success: false,
        message: 'name, code, category, and computationMethod are required.'
      });
    }

    const rule = await prisma.salaryRule.create({
      data: {
        name,
        code: code.toUpperCase().trim(),
        category,
        sequence: Number(sequence),
        computationMethod,
        amount: amount !== undefined ? amount : null,
        percentageOf: percentageOf || null,
        formula: formula || null
      }
    });

    return res.status(201).json({ success: true, message: 'Salary rule created.', data: rule });
  } catch (err) {
    next(err);
  }
};

export const updateRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, code, category, sequence, computationMethod, amount, percentageOf, formula } = req.body;

    const updated = await prisma.salaryRule.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code: code.toUpperCase().trim() }),
        ...(category && { category }),
        ...(sequence !== undefined && { sequence: Number(sequence) }),
        ...(computationMethod && { computationMethod }),
        ...(amount !== undefined && { amount }),
        ...(percentageOf !== undefined && { percentageOf }),
        ...(formula !== undefined && { formula })
      }
    });

    return res.json({ success: true, message: 'Salary rule updated.', data: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.salaryRule.delete({ where: { id } });
    return res.json({ success: true, message: 'Salary rule deleted.' });
  } catch (err) {
    next(err);
  }
};
