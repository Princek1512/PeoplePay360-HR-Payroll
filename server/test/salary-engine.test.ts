import { SalaryRuleEngine } from '../src/modules/payroll/salary-engine/rule-executor.js';

console.log('🧪 Running PeoplePay360 Salary Rule Engine Tests...');

const rules = [
  {
    id: 'r1',
    name: 'Basic Salary',
    code: 'BASIC',
    category: 'basic',
    sequence: 10,
    computationMethod: 'percentage',
    amount: 50,
    percentageOf: 'WAGE'
  },
  {
    id: 'r2',
    name: 'House Rent Allowance',
    code: 'HRA',
    category: 'allowance',
    sequence: 20,
    computationMethod: 'percentage',
    amount: 40,
    percentageOf: 'BASIC'
  },
  {
    id: 'r3',
    name: 'Conveyance Allowance',
    code: 'CONVEYANCE',
    category: 'allowance',
    sequence: 30,
    computationMethod: 'fixed',
    amount: 250
  },
  {
    id: 'r4',
    name: 'Special Allowance',
    code: 'SPECIAL',
    category: 'allowance',
    sequence: 40,
    computationMethod: 'formula',
    formula: 'WAGE - (BASIC + HRA + CONVEYANCE)'
  },
  {
    id: 'r5',
    name: 'Gross Salary',
    code: 'GROSS',
    category: 'gross',
    sequence: 50,
    computationMethod: 'formula',
    formula: 'BASIC + HRA + CONVEYANCE + SPECIAL'
  },
  {
    id: 'r6',
    name: 'Provident Fund (PF)',
    code: 'PF',
    category: 'deduction',
    sequence: 60,
    computationMethod: 'percentage',
    amount: 12,
    percentageOf: 'BASIC'
  },
  {
    id: 'r7',
    name: 'TDS / Income Tax',
    code: 'TAX',
    category: 'deduction',
    sequence: 70,
    computationMethod: 'formula',
    formula: 'GROSS * 0.10'
  },
  {
    id: 'r8',
    name: 'Net Salary',
    code: 'NET',
    category: 'net',
    sequence: 100,
    computationMethod: 'formula',
    formula: 'GROSS - (PF + TAX)'
  }
];

const contractWage = 10000;
const result = SalaryRuleEngine.execute(rules, {
  contractWage,
  workedDays: 30,
  totalDaysInPeriod: 30
});

console.log('Results:');
console.log('  Contract Wage:', contractWage);
console.log('  Calculated Gross:', result.grossSalary);
console.log('  Calculated Net:', result.netSalary);
console.log('  Breakdown lines:');
result.lines.forEach((l) => {
  console.log(`    [Seq ${l.sequence}] ${l.code.padEnd(12)} (${l.category}): $${l.amount}`);
});

// Assertions
const basicLine = result.lines.find((l) => l.code === 'BASIC');
const hraLine = result.lines.find((l) => l.code === 'HRA');
const specialLine = result.lines.find((l) => l.code === 'SPECIAL');
const pfLine = result.lines.find((l) => l.code === 'PF');
const taxLine = result.lines.find((l) => l.code === 'TAX');
const netLine = result.lines.find((l) => l.code === 'NET');

if (basicLine?.amount !== 5000) throw new Error(`Expected Basic 5000, got ${basicLine?.amount}`);
if (hraLine?.amount !== 2000) throw new Error(`Expected HRA 2000, got ${hraLine?.amount}`);
if (specialLine?.amount !== 2750) throw new Error(`Expected Special 2750, got ${specialLine?.amount}`);
if (result.grossSalary !== 10000) throw new Error(`Expected Gross 10000, got ${result.grossSalary}`);
if (pfLine?.amount !== 600) throw new Error(`Expected PF 600, got ${pfLine?.amount}`);
if (taxLine?.amount !== 1000) throw new Error(`Expected Tax 1000, got ${taxLine?.amount}`);
if (netLine?.amount !== 8400) throw new Error(`Expected Net 8400, got ${netLine?.amount}`);
if (result.netSalary !== 8400) throw new Error(`Expected Final Net 8400, got ${result.netSalary}`);

console.log('\n🎉 ALL SALARY RULE ENGINE TESTS PASSED PERFECTLY!\n');
