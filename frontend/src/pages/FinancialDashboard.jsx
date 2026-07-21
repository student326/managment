import { useState, useEffect } from 'react';
import { useExcel } from '../hooks/useExcel';
import { getFinancialSummary } from '../services/financialService';
import LoadingSpinner from '../components/LoadingSpinner';

export default function FinancialDashboard() {
  const { students, loading } = useExcel();
  const [period, setPeriod] = useState('all');
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!loading && students.length >= 0) {
      getFinancialSummary(students).then(setSummary);
    }
  }, [students, loading]);

  const monthlyData = useMemo(() => {
    const months = {};
    students.forEach((s) => {
      const d = s.paymentDate || s.admissionDate;
      if (!d) return;
      const key = d.substring(0, 7);
      if (!months[key]) months[key] = { collected: 0, count: 0 };
      months[key].collected += parseFloat(s.paid) || 0;
      months[key].count += 1;
    });
    return Object.entries(months).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  }, [students]);

  const maxMonthly = Math.max(...monthlyData.map(([, d]) => d.collected), 1);

  if (loading || !summary) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" text="Loading financial data..." /></div>;

  return (
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md text-on-surface">Financial Overview</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Complete financial picture of the institution</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600">payments</span>
            </div>
            <p className="text-label-md text-on-surface-variant">Total Income</p>
          </div>
          <p className="text-display-lg text-emerald-600 font-mono">PKR {summary.totalIncome.toLocaleString()}</p>
          <p className="text-label-md text-on-surface-variant mt-1">From {summary.studentCount} students</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-600">receipt</span>
            </div>
            <p className="text-label-md text-on-surface-variant">Total Expenses</p>
          </div>
          <p className="text-display-lg text-red-600 font-mono">PKR {summary.totalExpenses.toLocaleString()}</p>
          <p className="text-label-md text-on-surface-variant mt-1">{summary.expenseCount} expense records</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600">account_balance</span>
            </div>
            <p className="text-label-md text-on-surface-variant">Net Balance</p>
          </div>
          <p className={`text-display-lg font-mono ${summary.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            PKR {summary.netBalance.toLocaleString()}
          </p>
          <p className="text-label-md text-on-surface-variant mt-1">Income minus expenses</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600">pending</span>
            </div>
            <p className="text-label-md text-on-surface-variant">Pending Dues</p>
          </div>
          <p className="text-display-lg text-amber-600 font-mono">PKR {summary.totalPending.toLocaleString()}</p>
          <p className="text-label-md text-on-surface-variant mt-1">Outstanding from students</p>
        </div>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 sm:p-6">
        <h2 className="text-headline-sm text-on-surface mb-4">Monthly Collection Trend</h2>
          {monthlyData.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">bar_chart</span>
              <p className="text-body-md text-on-surface-variant">No payment data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {monthlyData.map(([month, data]) => (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-label-md text-on-surface-variant w-20">{month}</span>
                  <div className="flex-1">
                    <div className="w-full h-6 bg-surface-container rounded-lg overflow-hidden">
                      <div className="h-full bg-primary rounded-lg transition-all duration-500 flex items-center px-2" style={{ width: `${(data.collected / maxMonthly) * 100}%` }}>
                        <span className="text-xs text-on-primary font-medium whitespace-nowrap">PKR {data.collected.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-label-md text-on-surface-variant w-16 text-right">{data.count} txn</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 sm:p-6">
          <h2 className="text-headline-sm text-on-surface mb-4">Expense Breakdown</h2>
          {Object.keys(summary.expensesByCategory).length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">pie_chart</span>
              <p className="text-body-md text-on-surface-variant">No expenses recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(summary.expensesByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
                <div key={cat} className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                  <span className="text-body-md text-on-surface">{cat}</span>
                  <span className="text-body-md font-mono font-medium text-red-600">PKR {amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 sm:p-6">
        <h2 className="text-headline-sm text-on-surface mb-4">Financial Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-surface-container-low rounded-lg p-4">
            <h3 className="text-label-md text-on-surface-variant mb-3 font-semibold">Income Sources</h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-body-md text-on-surface-variant">Fee Collections</span><span className="text-body-md font-mono">PKR {summary.totalIncome.toLocaleString()}</span></div>
              <div className="flex justify-between border-t border-outline-variant pt-2"><span className="text-body-md font-semibold text-on-surface">Total Income</span><span className="text-body-md font-mono font-semibold text-emerald-600">PKR {summary.totalIncome.toLocaleString()}</span></div>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-lg p-4">
            <h3 className="text-label-md text-on-surface-variant mb-3 font-semibold">Expense Summary</h3>
            <div className="space-y-2">
              {Object.entries(summary.expensesByCategory).map(([cat, amt]) => (
                <div key={cat} className="flex justify-between"><span className="text-body-md text-on-surface-variant">{cat}</span><span className="text-body-md font-mono">PKR {amt.toLocaleString()}</span></div>
              ))}
              <div className="flex justify-between border-t border-outline-variant pt-2"><span className="text-body-md font-semibold text-on-surface">Total Expenses</span><span className="text-body-md font-mono font-semibold text-red-600">PKR {summary.totalExpenses.toLocaleString()}</span></div>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-lg p-4">
            <h3 className="text-label-md text-on-surface-variant mb-3 font-semibold">Net Position</h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-body-md text-on-surface-variant">Total Income</span><span className="text-body-md font-mono text-emerald-600">PKR {summary.totalIncome.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-body-md text-on-surface-variant">Total Expenses</span><span className="text-body-md font-mono text-red-600">- PKR {summary.totalExpenses.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-body-md text-on-surface-variant">Pending Dues</span><span className="text-body-md font-mono text-amber-600">PKR {summary.totalPending.toLocaleString()}</span></div>
              <div className="flex justify-between border-t border-outline-variant pt-2">
                <span className="text-body-md font-bold text-on-surface">Net Balance</span>
                <span className={`text-body-md font-mono font-bold ${summary.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>PKR {summary.netBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
