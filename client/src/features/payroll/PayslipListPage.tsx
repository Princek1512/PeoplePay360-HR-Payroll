import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ReceiptText, Search, ArrowUpRight } from 'lucide-react';

export const PayslipListPage: React.FC = () => {
  const navigate = useNavigate();
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/payslips');
        setPayslips(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayslips();
  }, []);

  const filtered = payslips.filter((p) =>
    p.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.payrun?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="pb-5 border-b border-border">
        <div className="flex items-center gap-2">
          <ReceiptText className="w-5 h-5 text-primary" />
          <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight">Payslip Archive</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Historical and active employee payslips with itemized salary rule breakdowns.
        </p>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by employee or pay run..."
          className="w-full bg-background border border-input rounded-md py-1.5 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="bg-secondary text-muted-foreground uppercase tracking-wider text-[10px] font-bold border-b border-border">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Pay Run</th>
                <th className="px-6 py-3.5">Period Window</th>
                <th className="px-6 py-3.5">Worked Days</th>
                <th className="px-6 py-3.5">Gross Pay</th>
                <th className="px-6 py-3.5">Net Salary</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">
                    Loading payslips...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">
                    No payslips found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/payslips/${p.id}`)}
                    className="hover:bg-secondary/60 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-foreground">
                      {p.employee?.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {p.payrun?.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      {formatDate(p.periodStart)} — {formatDate(p.periodEnd)}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {Number(p.workedDays)} days
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-foreground">
                      {formatCurrency(p.grossSalary)}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(p.netSalary)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                        View Statement <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
