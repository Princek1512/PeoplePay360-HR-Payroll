import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PayslipRenderService {
  public static async renderPayslipHtml(payslipId: string): Promise<string> {
    const payslip = await prisma.payslip.findUnique({
      where: { id: payslipId },
      include: {
        employee: {
          include: {
            department: true,
            jobPosition: true
          }
        },
        contract: true,
        payrun: true,
        lines: { orderBy: { sequence: 'asc' } }
      }
    });

    if (!payslip) {
      throw new Error('Payslip not found.');
    }

    const templatePath = path.resolve(__dirname, '../../templates/payslip.html');
    let html = fs.readFileSync(templatePath, 'utf-8');

    let totalDeductions = 0;
    payslip.lines.forEach((l) => {
      if (l.category === 'deduction') totalDeductions += Number(l.amount);
    });

    const rowsHtml = payslip.lines
      .map((line) => {
        const catClass = `tag-${line.category.toLowerCase()}`;
        return `
          <tr>
            <td>${line.sequence}</td>
            <td><strong>${line.code}</strong></td>
            <td>${line.label}</td>
            <td><span class="tag ${catClass}">${line.category}</span></td>
            <td class="num">$${Number(line.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          </tr>
        `;
      })
      .join('\n');

    const emp = payslip.employee;
    const bankDetails = emp.bankName ? `${emp.bankName} (${emp.bankIfsc || 'N/A'})` : 'N/A';
    const bankAccount = emp.bankAccountNumber ? `**** ${emp.bankAccountNumber.slice(-4)}` : 'N/A';

    html = html
      .replace(/{{payrunName}}/g, payslip.payrun.name)
      .replace(/{{employeeName}}/g, emp.name)
      .replace(/{{employeeEmail}}/g, emp.email)
      .replace(/{{department}}/g, emp.department?.name || 'General')
      .replace(/{{jobTitle}}/g, emp.jobPosition?.title || 'Associate')
      .replace(/{{bankAccount}}/g, bankAccount)
      .replace(/{{bankDetails}}/g, bankDetails)
      .replace(/{{workedDays}}/g, String(payslip.workedDays))
      .replace(/{{status}}/g, payslip.status.toUpperCase())
      .replace(/{{periodStart}}/g, new Date(payslip.periodStart).toLocaleDateString())
      .replace(/{{periodEnd}}/g, new Date(payslip.periodEnd).toLocaleDateString())
      .replace(/{{payslipId}}/g, payslip.id)
      .replace(/{{tableRows}}/g, rowsHtml)
      .replace(/{{grossSalary}}/g, Number(payslip.grossSalary).toLocaleString('en-US', { minimumFractionDigits: 2 }))
      .replace(/{{totalDeductions}}/g, totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 }))
      .replace(/{{netSalary}}/g, Number(payslip.netSalary).toLocaleString('en-US', { minimumFractionDigits: 2 }))
      .replace(/{{generatedAt}}/g, new Date().toLocaleString());

    return html;
  }
}
