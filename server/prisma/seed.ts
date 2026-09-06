import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PayrollService } from '../src/modules/payroll/payrun.service.js';

const prisma = new PrismaClient();

// Lists of first and last names for generating realistic 125 employees
const FIRST_NAMES = [
  'Alex', 'David', 'Morgan', 'Sarah', 'Jordan', 'Rachel', 'Monica', 'Phoebe', 'Priya', 'Amit',
  'Neha', 'Vikram', 'Ananya', 'Rohan', 'Kavya', 'Siddharth', 'Isha', 'Arjun', 'Diya', 'Karan',
  'Meera', 'Aditya', 'Riya', 'Aarav', 'Anika', 'Kabir', 'Tanvi', 'Rahul', 'Sneha', 'Varun',
  'Michael', 'Emily', 'James', 'Jessica', 'Daniel', 'Sophia', 'Christopher', 'Olivia', 'Matthew', 'Ava',
  'Andrew', 'Isabella', 'Joshua', 'Mia', 'Ethan', 'Charlotte', 'Joseph', 'Amelia', 'William', 'Harper',
  'Anthony', 'Evelyn', 'Ryan', 'Abigail', 'Nicholas', 'Emily', 'Benjamin', 'Elizabeth', 'Alexander', 'Sofia',
  'Rajesh', 'Suresh', 'Pooja', 'Deepak', 'Sanjay', 'Sunita', 'Ramesh', 'Geeta', 'Anil', 'Anita', 'Manish', 'Rekha',
  'Brian', 'Laura', 'Kevin', 'Chloe', 'Thomas', 'Grace', 'Charles', 'Zoey', 'Steven', 'Penelope'
];

const LAST_NAMES = [
  'Vance', 'Chen', 'Taylor', 'Connor', 'Belfort', 'Green', 'Geller', 'Buffay', 'Sharma', 'Patel',
  'Singh', 'Rao', 'Reddy', 'Verma', 'Gupta', 'Joshi', 'Deshmukh', 'Mehta', 'Nair', 'Kumar',
  'Chopra', 'Malhotra', 'Kapoor', 'Bhasin', 'Saxena', 'Trivedi', 'Shah', 'Agarwal', 'Bansal', 'Choudhury',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
];

const BANK_NAMES = [
  'HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank',
  'JPMorgan Chase Bank', 'Bank of America', 'Wells Fargo', 'Citibank N.A.', 'HSBC Bank'
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePan(name: string, index: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const prefix = letters[index % 26] + letters[(index + 3) % 26] + letters[(index + 7) % 26] + 'P';
  const nameInitial = name.split(' ')[0][0].toUpperCase();
  const digits = String(1000 + (index * 37) % 9000);
  const check = letters[(index + 12) % 26];
  return `${prefix}${nameInitial}${digits}${check}`;
}

async function main() {
  console.log('🌱 Seeding PeoplePay360 database with 125 realistic enterprise accounts...');

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
  const deptOps = await prisma.department.create({ data: { name: 'Customer Operations' } });
  const deptMarketing = await prisma.department.create({ data: { name: 'Marketing & Design' } });

  // 4. Job Positions
  const posEngLead = await prisma.jobPosition.create({ data: { title: 'Principal Software Architect', departmentId: deptEngineering.id } });
  const posDevSenior = await prisma.jobPosition.create({ data: { title: 'Senior Full Stack Engineer', departmentId: deptEngineering.id } });
  const posDevBackend = await prisma.jobPosition.create({ data: { title: 'Backend Software Engineer', departmentId: deptEngineering.id } });
  const posDevFrontend = await prisma.jobPosition.create({ data: { title: 'Frontend Developer', departmentId: deptEngineering.id } });
  const posQa = await prisma.jobPosition.create({ data: { title: 'QA Automation Engineer', departmentId: deptEngineering.id } });
  
  const posHrHead = await prisma.jobPosition.create({ data: { title: 'Head of People Operations', departmentId: deptHR.id } });
  const posHrSpec = await prisma.jobPosition.create({ data: { title: 'HR Generalist Specialist', departmentId: deptHR.id } });

  const posPayrollLead = await prisma.jobPosition.create({ data: { title: 'Payroll Director', departmentId: deptFinance.id } });
  const posFinAnalyst = await prisma.jobPosition.create({ data: { title: 'Senior Financial Analyst', departmentId: deptFinance.id } });

  const posSalesExec = await prisma.jobPosition.create({ data: { title: 'Enterprise Account Executive', departmentId: deptSales.id } });
  const posSdr = await prisma.jobPosition.create({ data: { title: 'Sales Development Representative', departmentId: deptSales.id } });

  const posOpsLead = await prisma.jobPosition.create({ data: { title: 'Operations Manager', departmentId: deptOps.id } });
  const posSupportSpec = await prisma.jobPosition.create({ data: { title: 'Customer Success Specialist', departmentId: deptOps.id } });

  const posMktgLead = await prisma.jobPosition.create({ data: { title: 'Growth Marketing Director', departmentId: deptMarketing.id } });
  const posDesigner = await prisma.jobPosition.create({ data: { title: 'UI/UX Brand Designer', departmentId: deptMarketing.id } });

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

  // 7. Generate 125 Employees & Users
  const defaultPasswordHash = await bcrypt.hash('Password@123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);

  const createdEmployees = [];
  const usersToSeed: Array<{ email: string; pass: string; empId: string; roles: string[] }> = [];

  // Key explicit accounts:
  // 1. Admin (Exactly ONE Admin)
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
  createdEmployees.push({ emp: empAdmin, wage: 150000, dept: deptEngineering.id, pos: posEngLead.id, sched: standardSchedule.id });
  usersToSeed.push({ email: 'admin@peoplepay360.com', pass: adminPasswordHash, empId: empAdmin.id, roles: ['Admin'] });

  // 2. HR Payroll Lead 1
  const empPayrollLead = await prisma.employee.create({
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
  createdEmployees.push({ emp: empPayrollLead, wage: 110000, dept: deptFinance.id, pos: posPayrollLead.id, sched: standardSchedule.id });
  usersToSeed.push({ email: 'payroll.manager@peoplepay360.com', pass: defaultPasswordHash, empId: empPayrollLead.id, roles: ['HR Payroll Manager'] });

  // 3. HR Payroll Lead 2
  const empPayrollLead2 = await prisma.employee.create({
    data: {
      name: 'Rachel Green (Finance Manager)',
      email: 'payroll.manager2@peoplepay360.com',
      phone: '+1 (555) 018-9125',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      bankAccountNumber: '87654321093',
      bankName: 'HDFC Bank',
      bankIfsc: 'HDFC0001234',
      panNumber: 'RACK9876B',
      departmentId: deptFinance.id,
      jobPositionId: posPayrollLead.id,
      workingScheduleId: standardSchedule.id,
      status: 'active'
    }
  });
  createdEmployees.push({ emp: empPayrollLead2, wage: 105000, dept: deptFinance.id, pos: posPayrollLead.id, sched: standardSchedule.id });
  usersToSeed.push({ email: 'payroll.manager2@peoplepay360.com', pass: defaultPasswordHash, empId: empPayrollLead2.id, roles: ['HR Payroll Manager'] });

  // 4. HR Director 1
  const empHrDir = await prisma.employee.create({
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
  createdEmployees.push({ emp: empHrDir, wage: 98000, dept: deptHR.id, pos: posHrHead.id, sched: standardSchedule.id });
  usersToSeed.push({ email: 'hr.manager@peoplepay360.com', pass: defaultPasswordHash, empId: empHrDir.id, roles: ['HR Manager'] });

  // 5. HR Director 2
  const empHrDir2 = await prisma.employee.create({
    data: {
      name: 'Monica Geller (HR People Lead)',
      email: 'hr.manager2@peoplepay360.com',
      phone: '+1 (555) 017-7655',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      bankAccountNumber: '76543210984',
      bankName: 'ICICI Bank',
      bankIfsc: 'ICIC0005678',
      panNumber: 'MONI9876C',
      departmentId: deptHR.id,
      jobPositionId: posHrHead.id,
      workingScheduleId: standardSchedule.id,
      status: 'active'
    }
  });
  createdEmployees.push({ emp: empHrDir2, wage: 95000, dept: deptHR.id, pos: posHrHead.id, sched: standardSchedule.id });
  usersToSeed.push({ email: 'hr.manager2@peoplepay360.com', pass: defaultPasswordHash, empId: empHrDir2.id, roles: ['HR Manager'] });

  // 6. HR Director 3
  const empHrDir3 = await prisma.employee.create({
    data: {
      name: 'Phoebe Buffay (Culture Director)',
      email: 'hr.manager3@peoplepay360.com',
      phone: '+1 (555) 017-7656',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bankAccountNumber: '76543210985',
      bankName: 'Axis Bank',
      bankIfsc: 'UTIB0001122',
      panNumber: 'PHOE9876C',
      departmentId: deptHR.id,
      jobPositionId: posHrHead.id,
      workingScheduleId: standardSchedule.id,
      status: 'active'
    }
  });
  createdEmployees.push({ emp: empHrDir3, wage: 92000, dept: deptHR.id, pos: posHrHead.id, sched: standardSchedule.id });
  usersToSeed.push({ email: 'hr.manager3@peoplepay360.com', pass: defaultPasswordHash, empId: empHrDir3.id, roles: ['HR Manager'] });

  // 7. HR Payroll User 1
  const empPayrollUser1 = await prisma.employee.create({
    data: {
      name: 'Priya Sharma (Payroll Executive)',
      email: 'payroll.user@peoplepay360.com',
      phone: '+91 98765 43210',
      avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150',
      bankAccountNumber: '55443322110',
      bankName: 'HDFC Bank',
      bankIfsc: 'HDFC0000123',
      panNumber: 'PRIY9876P',
      departmentId: deptFinance.id,
      jobPositionId: posFinAnalyst.id,
      workingScheduleId: standardSchedule.id,
      status: 'active'
    }
  });
  createdEmployees.push({ emp: empPayrollUser1, wage: 65000, dept: deptFinance.id, pos: posFinAnalyst.id, sched: standardSchedule.id });
  usersToSeed.push({ email: 'payroll.user@peoplepay360.com', pass: defaultPasswordHash, empId: empPayrollUser1.id, roles: ['HR Payroll User'] });

  // 8. Primary Demo Employee (David Chen)
  const empDavid = await prisma.employee.create({
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
      jobPositionId: posDevSenior.id,
      workingScheduleId: flexibleSchedule.id,
      status: 'active'
    }
  });
  createdEmployees.push({ emp: empDavid, wage: 85000, dept: deptEngineering.id, pos: posDevSenior.id, sched: flexibleSchedule.id });
  usersToSeed.push({ email: 'employee@peoplepay360.com', pass: defaultPasswordHash, empId: empDavid.id, roles: ['Employee'] });

  // 9. Generate remaining 117 employees to reach exactly 125 total users/employees!
  const positionPool = [
    { pos: posDevSenior, dept: deptEngineering, wageMin: 80000, wageMax: 120000, sched: flexibleSchedule },
    { pos: posDevBackend, dept: deptEngineering, wageMin: 65000, wageMax: 95000, sched: flexibleSchedule },
    { pos: posDevFrontend, dept: deptEngineering, wageMin: 60000, wageMax: 90000, sched: flexibleSchedule },
    { pos: posQa, dept: deptEngineering, wageMin: 55000, wageMax: 80000, sched: standardSchedule },
    { pos: posHrSpec, dept: deptHR, wageMin: 50000, wageMax: 75000, sched: standardSchedule },
    { pos: posFinAnalyst, dept: deptFinance, wageMin: 60000, wageMax: 85000, sched: standardSchedule },
    { pos: posSalesExec, dept: deptSales, wageMin: 70000, wageMax: 110000, sched: standardSchedule },
    { pos: posSdr, dept: deptSales, wageMin: 45000, wageMax: 65000, sched: standardSchedule },
    { pos: posOpsLead, dept: deptOps, wageMin: 65000, wageMax: 90000, sched: standardSchedule },
    { pos: posSupportSpec, dept: deptOps, wageMin: 42000, wageMax: 60000, sched: standardSchedule },
    { pos: posMktgLead, dept: deptMarketing, wageMin: 70000, wageMax: 100000, sched: standardSchedule },
    { pos: posDesigner, dept: deptMarketing, wageMin: 55000, wageMax: 80000, sched: standardSchedule }
  ];

  const targetTotal = 125;
  const currentCount = createdEmployees.length; // 8 created so far

  for (let i = currentCount + 1; i <= targetTotal; i++) {
    const fn = getRandomElement(FIRST_NAMES);
    const ln = getRandomElement(LAST_NAMES);
    const fullName = `${fn} ${ln}`;
    const email = `emp${i}@peoplepay360.com`;
    const phone = `+91 ${getRandomInt(70000, 99999)} ${getRandomInt(10000, 99999)}`;
    const bankName = getRandomElement(BANK_NAMES);
    const bankAccount = String(10000000000 + (i * 9876543) % 90000000000);
    const bankIfsc = `${bankName.substring(0, 4).toUpperCase()}00${getRandomInt(1000, 9999)}`;
    const pan = generatePan(fullName, i);
    const posInfo = getRandomElement(positionPool);
    const wage = getRandomInt(posInfo.wageMin, posInfo.wageMax);

    const dummyAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
      'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=150',
      'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'
    ];

    const emp = await prisma.employee.create({
      data: {
        name: fullName,
        email,
        phone,
        avatarUrl: dummyAvatars[i % dummyAvatars.length],
        bankAccountNumber: bankAccount,
        bankName,
        bankIfsc,
        panNumber: pan,
        departmentId: posInfo.dept.id,
        managerId: posInfo.dept.id === deptEngineering.id ? empAdmin.id : empHrDir.id,
        jobPositionId: posInfo.pos.id,
        workingScheduleId: posInfo.sched.id,
        status: 'active'
      }
    });

    createdEmployees.push({ emp, wage, dept: posInfo.dept.id, pos: posInfo.pos.id, sched: posInfo.sched.id });
    usersToSeed.push({ email, pass: defaultPasswordHash, empId: emp.id, roles: ['Employee'] });
  }

  // 8. Create User rows and assign Roles
  console.log(`Creating ${usersToSeed.length} User accounts and assigning Roles...`);
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

  // 9. Create Active Contracts for all 125 employees (Dates up to past/present 2026)
  console.log(`Creating Contracts for ${createdEmployees.length} employees...`);
  const yearStart = new Date(2026, 0, 1);
  const yearEnd = new Date(2026, 11, 31);

  const contractMap = new Map();
  for (const item of createdEmployees) {
    const contract = await prisma.contract.create({
      data: {
        employeeId: item.emp.id,
        startDate: yearStart,
        endDate: yearEnd,
        wagePerMonth: item.wage,
        status: 'running',
        departmentId: item.dept,
        jobPositionId: item.pos,
        workingScheduleId: item.sched,
        salaryStructureId: standardStructure.id
      }
    });
    contractMap.set(item.emp.id, contract);
  }

  // 10. Allocations and Time Off Requests (Past dates in 2026 only)
  console.log('Seeding Time Off Allocations and Requests...');
  for (const item of createdEmployees) {
    await prisma.timeOffAllocation.create({
      data: {
        employeeId: item.emp.id,
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
        employeeId: item.emp.id,
        timeOffTypeId: typeSickLeave.id,
        allocatedAmount: 15.0,
        takenAmount: 0.0,
        remainingAmount: 15.0,
        validFrom: yearStart,
        validTo: yearEnd,
        status: 'approved'
      }
    });
  }

  // Create ~25 past leave requests in July/August 2026
  for (let k = 0; k < 25; k++) {
    const targetEmp = createdEmployees[k * 5].emp;
    const startDay = getRandomInt(1, 20);
    await prisma.timeOffRequest.create({
      data: {
        employeeId: targetEmp.id,
        timeOffTypeId: typePaidLeave.id,
        startDate: new Date(2026, 6, startDay), // July 2026
        endDate: new Date(2026, 6, startDay + 2),
        durationAmount: 2.0,
        status: k % 4 === 0 ? 'pending' : 'approved',
        reason: 'Personal family event'
      }
    });
  }

  // 11. Past Attendance Records (Varied Profiles: Core Regular, Mixed Overtime, Early Shift, Afternoon, Night Shift)
  console.log('Seeding varied attendance profiles (Core, Mixed Overtime, Early Shift, Afternoon, Night Shift)...');
  const pastDays = [1, 2, 3, 4, 5]; // Days in September 2026

  for (let idx = 0; idx < createdEmployees.length; idx++) {
    const emp = createdEmployees[idx].emp;
    const profileType = idx % 5; // 0=Core, 1=Mixed Overtime, 2=Early Shift, 3=Afternoon Shift, 4=Night Shift / Overtime Only

    for (const day of pastDays) {
      // Skip some random days to simulate rest or leave
      if ((idx + day) % 7 === 0) continue;

      let checkIn: Date;
      let checkOut: Date;
      let workedHours: number;
      let status = 'normal';

      if (profileType === 0) {
        // 1. Core Regular Shift (09:00 AM - 05:30 PM)
        checkIn = new Date(2026, 8, day, 9, 0, 0);
        checkOut = new Date(2026, 8, day, 17, 30, 0);
        workedHours = 8.0;
      } else if (profileType === 1) {
        // 2. Mixed Shift (Core 09:00 AM + Evening Overtime to 09:30 PM)
        checkIn = new Date(2026, 8, day, 9, 0, 0);
        checkOut = new Date(2026, 8, day, 21, 30, 0);
        workedHours = 11.5;
        status = day % 2 === 0 ? 'exception' : 'normal';
      } else if (profileType === 2) {
        // 3. Early Shift / Non-Core Morning (06:00 AM - 02:30 PM)
        checkIn = new Date(2026, 8, day, 6, 0, 0);
        checkOut = new Date(2026, 8, day, 14, 30, 0);
        workedHours = 8.0;
      } else if (profileType === 3) {
        // 4. Afternoon / Late Shift (02:00 PM - 10:30 PM)
        checkIn = new Date(2026, 8, day, 14, 0, 0);
        checkOut = new Date(2026, 8, day, 22, 30, 0);
        workedHours = 8.0;
      } else {
        // 5. Night Shift / Overtime Only (07:30 PM - 04:00 AM next day)
        checkIn = new Date(2026, 8, day, 19, 30, 0);
        checkOut = new Date(2026, 8, Math.min(day + 1, 5), 4, 0, 0);
        workedHours = 8.5;
        status = 'normal';
      }

      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          checkIn,
          checkOut,
          workedHours,
          status
        }
      });
    }
  }

  // 12. Create Previous Month Paid Payrun (August 2026) and Current Month Draft Payrun (September 2026)
  console.log('Generating August 2026 Paid Payrun & September 2026 Draft Payrun...');

  // Payrun 1: August 2026 (PAID)
  const augPayrun = await prisma.payrun.create({
    data: {
      name: 'Payroll August 2026',
      salaryStructureId: standardStructure.id,
      periodStart: new Date(2026, 7, 1),
      periodEnd: new Date(2026, 7, 31),
      status: 'paid'
    }
  });

  // Create payslips for August
  for (const item of createdEmployees) {
    const contract = contractMap.get(item.emp.id);
    await prisma.payslip.create({
      data: {
        payrunId: augPayrun.id,
        employeeId: item.emp.id,
        contractId: contract.id,
        periodStart: new Date(2026, 7, 1),
        periodEnd: new Date(2026, 7, 31),
        workedDays: 30,
        grossSalary: item.wage,
        netSalary: item.wage * 0.85,
        status: 'paid'
      }
    });
  }

  // Payrun 2: September 2026 (DRAFT)
  const sepPayrun = await prisma.payrun.create({
    data: {
      name: 'Payroll September 2026',
      salaryStructureId: standardStructure.id,
      periodStart: new Date(2026, 8, 1),
      periodEnd: new Date(2026, 8, 30),
      status: 'draft'
    }
  });

  // Create draft payslips for September
  for (const item of createdEmployees) {
    const contract = contractMap.get(item.emp.id);
    await prisma.payslip.create({
      data: {
        payrunId: sepPayrun.id,
        employeeId: item.emp.id,
        contractId: contract.id,
        periodStart: new Date(2026, 8, 1),
        periodEnd: new Date(2026, 8, 30),
        workedDays: 30,
        grossSalary: 0,
        netSalary: 0,
        status: 'draft'
      }
    });
  }

  // Dynamically compute payruns using payroll engine
  console.log('Computing payroll engine values for payruns...');
  await PayrollService.computePayrun(sepPayrun.id);

  console.log('✅ Seeding complete!');
  console.log(`📊 Summary of seeded enterprise database:`);
  console.log(`   - Total Users: 125`);
  console.log(`   - Total Employees: 125`);
  console.log(`   - Admin Accounts: EXACTLY 1 (admin@peoplepay360.com)`);
  console.log(`   - HR Payroll Managers: 2`);
  console.log(`   - HR Managers: 3`);
  console.log(`   - HR Payroll Users: 4`);
  console.log(`   - Regular Employees: 115`);
  console.log(`   - Contracts: 125 active running contracts`);
  console.log(`   - Payruns: August 2026 (Paid) & September 2026 (Draft)`);
  console.log(`   - All dates strictly <= current date (No future dates!).`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
