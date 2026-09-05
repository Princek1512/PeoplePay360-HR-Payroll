import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ReceiptText, Search, ArrowUpRight, AlertTriangle } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ReceiptText className="w-5 h-5 text-brand-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">Payslip Archive</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Historical and active employee payslips with itemized salary rule breakdowns.
        </p>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by employee or pay run..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                    Loading payslips...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                    No payslips found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/payslips/${p.id}`)}
                    className="hover:bg-slate-850/40 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{p.employee?.name}</div>
                      <div className="text-[11px] text-slate-400">{p.employee?.department?.name || 'Staff'}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-200">
                      {p.payrun?.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">
                      {formatDate(p.payrun?.periodStart)} <span className="text-slate-500">➔</span> {formatDate(p.payrun?.periodEnd)}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {Number(p.workedDays)} days
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-200">
                      {formatCurrency(p.grossSalary)}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(p.netSalary)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-brand-400 hover:text-brand-300 font-semibold inline-flex items-center gap-1">
                        View <ArrowUpRight className="w-3.5 h-3.5" />
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
