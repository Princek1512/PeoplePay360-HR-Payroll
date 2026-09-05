import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PeoplePay360 database with realistic enterprise data...');

  // Clean existing records in reverse dependency order
  await prisma.payslipLine.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.payrun.deleteMany();
  await prisma.timeOffRequest.deleteMany();
  await prisma.timeOffAllocation.deleteMany();
  await prisma.timeOffType.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.workingScheduleLine.deleteMany();
  await prisma.salaryStructureRule.deleteMany();
  await prisma.salaryRule.deleteMany();
  await prisma.salaryStructure.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.jobPosition.deleteMany();
  await prisma.department.deleteMany();
  await prisma.workingSchedule.deleteMany();
  await prisma.role.deleteMany();

  // 1. Roles
  const roles = await Promise.all([
    prisma.role.create({ data: { name: 'Admin' } }),
    prisma.role.create({ data: { name: 'HR Payroll Manager' } }),
    prisma.role.create({ data: { name: 'HR Payroll User' } }),
    prisma.role.create({ data: { name: 'HR Manager' } }),
    prisma.role.create({ data: { name: 'Employee' } })
  ]);

  const roleMap = new Map(roles.map((r) => [r.name, r.id]));

  // 2. Working Schedules
  const standardSchedule = await prisma.workingSchedule.create({
    data: {
      name: 'Standard 40h Work Week',
      calendarType: 'standard',
      status: 'active',
      totalWeeklyHours: 40.0,
      lines: {
        create: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', breakMinutes: 60 }
        ]
      }
    }
  });

  const flexibleSchedule = await prisma.workingSchedule.create({
    data: {
      name: 'Flexible 35h Engineering',
      calendarType: 'flexible',
      status: 'active',
      totalWeeklyHours: 35.0,
      lines: {
        create: [
          { dayOfWeek: 1, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 2, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 3, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 4, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 5, startTime: '10:00', endTime: '18:00', breakMinutes: 60 }
        ]
      }
    }
  });

  // 3. Departments
  const deptEngineering = await prisma.department.create({ data: { name: 'Engineering & Product' } });
  const deptHR = await prisma.department.create({ data: { name: 'Human Resources' } });
  const deptFinance = await prisma.department.create({ data: { name: 'Finance & Payroll' } });
  const deptSales = await prisma.department.create({ data: { name: 'Sales & Growth' } });

  // 4. Job Positions
  const posEngLead = await prisma.jobPosition.create({ data: { title: 'Principal Software Architect', departmentId: deptEngineering.id } });
  const posDev = await prisma.jobPosition.create({ data: { title: 'Senior Full Stack Engineer', departmentId: deptEngineering.id } });
  const posHrHead = await prisma.jobPosition.create({ data: { title: 'Head of People Operations', departmentId: deptHR.id } });
  const posPayrollLead = await prisma.jobPosition.create({ data: { title: 'Payroll Director', departmentId: deptFinance.id } });
  const posSalesExec = await prisma.jobPosition.create({ data: { title: 'Enterprise Account Executive', departmentId: deptSales.id } });

  // 5. Salary Structure & Rules
  const standardStructure = await prisma.salaryStructure.create({
    data: {
      name: 'Standard Corporate Salary Structure',
      isActive: true
    }
  });

  const ruleBasic = await prisma.salaryRule.create({
    data: {
      name: 'Basic Salary',
      code: 'BASIC',
      category: 'basic',
      sequence: 10,
      computationMethod: 'percentage',
      amount: 50, // 50% of Wage
      percentageOf: 'WAGE'
    }
  });

  const ruleHra = await prisma.salaryRule.create({
    data: {
      name: 'House Rent Allowance (HRA)',
      code: 'HRA',
      category: 'allowance',
      sequence: 20,
      computationMethod: 'percentage',
      amount: 40, // 40% of Basic
      percentageOf: 'BASIC'
    }
  });

  const ruleConveyance = await prisma.salaryRule.create({
    data: {
      name: 'Conveyance Allowance',
      code: 'CONVEYANCE',
      category: 'allowance',
      sequence: 30,
      computationMethod: 'fixed',
      amount: 250.00
    }
  });

  const ruleSpecial = await prisma.salaryRule.create({
    data: {
      name: 'Special Allowance',
      code: 'SPECIAL',
      category: 'allowance',
      sequence: 40,
      computationMethod: 'formula',
      formula: 'WAGE - (BASIC + HRA + CONVEYANCE)'
    }
  });

  const ruleOvertime = await prisma.salaryRule.create({
    data: {
      name: 'Overtime Pay (Reduced Rate 0.8x)',
      code: 'OVERTIME',
      category: 'allowance',
      sequence: 45,
      computationMethod: 'formula',
      formula: 'OVERTIME_PAY'
    }
  });

  const ruleGross = await prisma.salaryRule.create({
    data: {
      name: 'Gross Salary',
      code: 'GROSS',
      category: 'gross',
      sequence: 50,
      computationMethod: 'formula',
      formula: 'BASIC + HRA + CONVEYANCE + SPECIAL + OVERTIME'
    }
  });

  const rulePf = await prisma.salaryRule.create({
    data: {
      name: 'Provident Fund (PF)',
      code: 'PF',
      category: 'deduction',
      sequence: 60,
      computationMethod: 'percentage',
      amount: 12, // 12% of Basic
      percentageOf: 'BASIC'
    }
  });

  const ruleTax = await prisma.salaryRule.create({
    data: {
      name: 'Tax Deducted at Source (TDS)',
      code: 'TAX',
      category: 'deduction',
      sequence: 70,
      computationMethod: 'formula',
      formula: 'GROSS * 0.10' // 10% of Gross
    }
  });

  const ruleNet = await prisma.salaryRule.create({
    data: {
      name: 'Net Salary',
      code: 'NET',
      category: 'net',
      sequence: 100,
      computationMethod: 'formula',
      formula: 'GROSS - (PF + TAX)'
    }
  });

  // Attach Rules to Structure with Sequence
  const orderedRules = [ruleBasic, ruleHra, ruleConveyance, ruleSpecial, ruleOvertime, ruleGross, rulePf, ruleTax, ruleNet];
  for (const r of orderedRules) {
    await prisma.salaryStructureRule.create({
      data: {
        structureId: standardStructure.id,
        ruleId: r.id,
        sequence: r.sequence
      }
    });
  }

  // 6. Time Off Types
  const typePaidLeave = await prisma.timeOffType.create({
    data: {
      name: 'Paid Time Off (PTO)',
      unit: 'days',
      requiresAllocation: true,
      approvalFlow: 'manager',
      affectsPayroll: false
    }
  });

  const typeSickLeave = await prisma.timeOffType.create({
    data: {
      name: 'Sick / Medical Leave',
      unit: 'days',
      requiresAllocation: true,
      approvalFlow: 'manager',
      affectsPayroll: false
    }
  });

  const typeUnpaid = await prisma.timeOffType.create({
    data: {
      name: 'Unpaid Leave (LWP)',
      unit: 'days',
      requiresAllocation: false,
      approvalFlow: 'hr',
      affectsPayroll: true
    }
  });

  // 7. Seed Employees
  const defaultPasswordHash = await bcrypt.hash('Password@123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);

  // Employee 1: System Admin
  const empAdmin = await prisma.employee.create({
    data: {
      name: 'Alex Vance (Admin)',
      email: 'admin@peoplepay360.com',
      phone: '+1 (555) 019-2831',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bankAccountNumber: '98765432101',
      bankName: 'JPMorgan Chase Bank',
      bankIfsc: 'CHASUS33',
      panNumber: 'ALEXV9876A',
      departmentId: deptEngineering.id,
      jobPositionId: posEngLead.id,
      workingScheduleId: standardSchedule.id,
      status: 'active'
    }
  });

  // Employee 2: HR Payroll Manager
  const empPayrollManager = await prisma.employee.create({
    data: {
      name: 'Morgan Taylor (Payroll Lead)',
      email: 'payroll.manager@peoplepay360.com',
      phone: '+1 (555) 018-9124',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bankAccountNumber: '87654321092',
      bankName: 'Bank of America',
      bankIfsc: 'BOFAUS3N',
      panNumber: 'MORG9876B',
      departmentId: deptFinance.id,
      jobPositionId: posPayrollLead.id,
      workingScheduleId: standardSchedule.id,
      status: 'active'
    }
  });

  // Employee 3: HR Manager
  const empHrManager = await prisma.employee.create({
    data: {
      name: 'Sarah Connor (HR Director)',
      email: 'hr.manager@peoplepay360.com',
      phone: '+1 (555) 017-7654',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      bankAccountNumber: '76543210983',
      bankName: 'Wells Fargo',
      bankIfsc: 'WFBIUS6S',
      panNumber: 'SARA9876C',
      departmentId: deptHR.id,
      jobPositionId: posHrHead.id,
      workingScheduleId: standardSchedule.id,
      status: 'active'
    }
  });

  // Employee 4: Senior Engineer (Regular Employee)
  const empEngineer = await prisma.employee.create({
    data: {
      name: 'David Chen (Software Engineer)',
      email: 'employee@peoplepay360.com',
      phone: '+1 (555) 014-4321',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      bankAccountNumber: '65432109874',
      bankName: 'Citibank N.A.',
      bankIfsc: 'CITIUS33',
      panNumber: 'DAVI9876D',
      departmentId: deptEngineering.id,
      managerId: empAdmin.id,
      jobPositionId: posDev.id,
      workingScheduleId: flexibleSchedule.id,
      status: 'active'
    }
  });

  // Employee 5: Sales Rep (Warning test: Missing bank account)
  const empSales = await prisma.employee.create({
    data: {
      name: 'Jordan Belfort (Account Exec)',
      email: 'sales@peoplepay360.com',
      phone: '+1 (555) 012-3456',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
      bankAccountNumber: null, // Intentionally null for blocking warning demo!
      bankName: null,
      bankIfsc: null,
      panNumber: 'JORD9876E',
      departmentId: deptSales.id,
      jobPositionId: posSalesExec.id,
      workingScheduleId: standardSchedule.id,
      status: 'active'
    }
  });

  // 8. Create Users & Assign Roles
  const usersToSeed = [
    { email: 'admin@peoplepay360.com', pass: adminPasswordHash, empId: empAdmin.id, roles: ['Admin'] },
    { email: 'payroll.manager@peoplepay360.com', pass: defaultPasswordHash, empId: empPayrollManager.id, roles: ['HR Payroll Manager'] },
    { email: 'hr.manager@peoplepay360.com', pass: defaultPasswordHash, empId: empHrManager.id, roles: ['HR Manager'] },
    { email: 'employee@peoplepay360.com', pass: defaultPasswordHash, empId: empEngineer.id, roles: ['Employee'] },
    { email: 'payroll.user@peoplepay360.com', pass: defaultPasswordHash, empId: null, roles: ['HR Payroll User'] }
  ];

  for (const u of usersToSeed) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash: u.pass,
        employeeId: u.empId,
        isActive: true
      }
    });

    for (const roleName of u.roles) {
      const roleId = roleMap.get(roleName);
      if (roleId) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId }
        });
      }
    }
  }

  // 9. Active Contracts
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31);

  const contractData = [
    { empId: empAdmin.id, wage: 12500, dept: deptEngineering.id, pos: posEngLead.id, sched: standardSchedule.id },
    { empId: empPayrollManager.id, wage: 9500, dept: deptFinance.id, pos: posPayrollLead.id, sched: standardSchedule.id },
    { empId: empHrManager.id, wage: 8800, dept: deptHR.id, pos: posHrHead.id, sched: standardSchedule.id },
    { empId: empEngineer.id, wage: 8000, dept: deptEngineering.id, pos: posDev.id, sched: flexibleSchedule.id },
    { empId: empSales.id, wage: 7200, dept: deptSales.id, pos: posSalesExec.id, sched: standardSchedule.id }
  ];

  const contracts = [];
  for (const c of contractData) {
    const contract = await prisma.contract.create({
      data: {
        employeeId: c.empId,
        startDate: yearStart,
        endDate: yearEnd,
        wagePerMonth: c.wage,
        status: 'running',
        departmentId: c.dept,
        jobPositionId: c.pos,
        workingScheduleId: c.sched,
        salaryStructureId: standardStructure.id
      }
    });
    contracts.push(contract);
  }

  // 10. Time Off Allocations
  for (const emp of [empAdmin, empPayrollManager, empHrManager, empEngineer, empSales]) {
    await prisma.timeOffAllocation.create({
      data: {
        employeeId: emp.id,
        timeOffTypeId: typePaidLeave.id,
        allocatedAmount: 20.0,
        takenAmount: 2.0,
        remainingAmount: 18.0,
        validFrom: yearStart,
        validTo: yearEnd,
        status: 'approved'
      }
    });

    await prisma.timeOffAllocation.create({
      data: {
        employeeId: emp.id,
        timeOffTypeId: typeSickLeave.id,
        allocatedAmount: 10.0,
        takenAmount: 0.0,
        remainingAmount: 10.0,
        validFrom: yearStart,
        validTo: yearEnd,
        status: 'approved'
      }
    });
  }

  // 11. Sample Time Off Request
  await prisma.timeOffRequest.create({
    data: {
      employeeId: empEngineer.id,
      timeOffTypeId: typePaidLeave.id,
      startDate: new Date(now.getFullYear(), now.getMonth(), 5),
      endDate: new Date(now.getFullYear(), now.getMonth(), 6),
      durationAmount: 2.0,
      status: 'approved',
      reason: 'Attending annual tech conference'
    }
  });

  // 12. Attendance records for current month
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Seed 16 days of regular daytime shift attendance for empEngineer (David Chen) (120 hrs core shift)
  for (let day = 1; day <= 16; day++) {
    const checkIn = new Date(now.getFullYear(), now.getMonth(), day, 9, 0, 0);
    const checkOut = new Date(now.getFullYear(), now.getMonth(), day, 16, 30, 0); // 7.5h shift
    await prisma.attendance.create({
      data: {
        employeeId: empEngineer.id,
        checkIn,
        checkOut,
        workedHours: 7.5,
        status: 'normal'
      }
    });
  }

  // David Chen Overtime Entry 1: Sep 19, 7:00 PM to 11:30 PM (4.5 hrs out-of-range overtime)
  const dcOt1Start = new Date(now.getFullYear(), 8, 19, 19, 0, 0);
  const dcOt1End = new Date(now.getFullYear(), 8, 19, 23, 30, 0);
  await prisma.attendance.create({
    data: {
      employeeId: empEngineer.id,
      checkIn: dcOt1Start,
      checkOut: dcOt1End,
      workedHours: 4.5,
      status: 'normal'
    }
  });

  // David Chen Overtime Entry 2: Sep 20, 7:30 PM to Sep 21, 9:00 AM (13.5 hrs out-of-range overnight overtime)
  const dcOt2Start = new Date(now.getFullYear(), 8, 20, 19, 30, 0);
  const dcOt2End = new Date(now.getFullYear(), 8, 21, 9, 0, 0);
  await prisma.attendance.create({
    data: {
      employeeId: empEngineer.id,
      checkIn: dcOt2Start,
      checkOut: dcOt2End,
      workedHours: 13.5,
      status: 'normal'
    }
  });

  // Seed 20 days of attendance for empPayrollManager (Exact shift scenario: 8 hours per day = 160 hrs total)
  for (let day = 1; day <= 20; day++) {
    const checkIn = new Date(now.getFullYear(), now.getMonth(), day, 9, 0, 0);
    const checkOut = new Date(now.getFullYear(), now.getMonth(), day, 17, 0, 0); // 8h shift
    await prisma.attendance.create({
      data: {
        employeeId: empPayrollManager.id,
        checkIn,
        checkOut,
        workedHours: 8.0,
        status: 'normal'
      }
    });
  }

  // Seed 15 days of attendance for empHrManager (Under-time scenario: 120 hrs total vs 160h target)
  for (let day = 1; day <= 15; day++) {
    const checkIn = new Date(now.getFullYear(), now.getMonth(), day, 9, 0, 0);
    const checkOut = new Date(now.getFullYear(), now.getMonth(), day, 17, 0, 0); // 8h shift for 15 days = 120h
    await prisma.attendance.create({
      data: {
        employeeId: empHrManager.id,
        checkIn,
        checkOut,
        workedHours: 8.0,
        status: 'normal'
      }
    });
  }

  // 13. Pre-create a Full Demo Payrun & Compute via Engine
  const demoPayrun = await prisma.payrun.create({
    data: {
      name: `Payroll ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      salaryStructureId: standardStructure.id,
      periodStart: currentMonthStart,
      periodEnd: currentMonthEnd,
      status: 'draft'
    }
  });

  // Create initial payslips for running contracts
  const eligibleContracts = contracts.filter((c) => c.employeeId !== empSales.id); // exclude blocking warning test
  for (const c of eligibleContracts) {
    await prisma.payslip.create({
      data: {
        payrunId: demoPayrun.id,
        employeeId: c.employeeId,
        contractId: c.id,
        periodStart: currentMonthStart,
        periodEnd: currentMonthEnd,
        workedDays: 30,
        grossSalary: 0,
        netSalary: 0,
        status: 'draft'
      }
    });
  }

  // Dynamically compute payrun with shift attendance calculation engine
  const { PayrollService } = await import('../src/modules/payroll/payrun.service.js');
  await PayrollService.computePayrun(demoPayrun.id);
  await PayrollService.validatePayrun(demoPayrun.id);

  console.log('✅ Seed completed successfully!');
  console.log('📋 Demo Accounts created:');
  console.log('   - Admin: admin@peoplepay360.com / Admin@123');
  console.log('   - Payroll Manager: payroll.manager@peoplepay360.com / Password@123');
  console.log('   - HR Manager: hr.manager@peoplepay360.com / Password@123');
  console.log('   - Employee: employee@peoplepay360.com / Password@123');
  console.log('   - Payroll User: payroll.user@peoplepay360.com / Password@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
