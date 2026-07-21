import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useExcel } from '../hooks/useExcel';
import { exportStudentsPDF } from '../services/pdfService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Reports() {
  const { students, loading } = useExcel();
  const [reportType, setReportType] = useState('fee-summary');

  const stats = useMemo(() => {
    const total = students.length;
    const totalFee = students.reduce((s, r) => s + (parseFloat(r.totalFee) || 0), 0);
    const totalPaid = students.reduce((s, r) => s + (parseFloat(r.paid) || 0), 0);
    const totalPending = students.reduce((s, r) => s + (parseFloat(r.pending) || 0), 0);
    const paidCount = students.filter((r) => r.status?.toLowerCase() === 'paid').length;
    const partialCount = students.filter((r) => r.status?.toLowerCase() === 'partial').length;
    const unpaidCount = students.filter((r) => r.status?.toLowerCase() === 'unpaid' || r.status?.toLowerCase() === 'pending').length;
    const methods = {};
    students.forEach((r) => {
      const m = r.paymentMethod || 'N/A';
      methods[m] = (methods[m] || 0) + (parseFloat(r.paid) || 0);
    });
    return { total, totalFee, totalPaid, totalPending, paidCount, partialCount, unpaidCount, methods };
  }, [students]);

  const handleExportReport = () => {
    if (students.length === 0) return;
    const rows = students.map((s) => ({
      ID: s.studentId, Name: s.studentName, 'Father Name': s.fatherName, Phone: s.phone, Email: s.email,
      Course: s.course, Batch: s.batch, 'Admission Date': s.admissionDate, 'Total Fee': s.totalFee,
      Paid: s.paid, Pending: s.pending, Status: s.status, 'Payment Method': s.paymentMethod,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'students_fee_report.xlsx');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" text="Generating reports..." />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md text-on-surface">Reports</h1>
          <p className="text-body-md text-on-surface-variant mt-1">View and export financial reports</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => exportStudentsPDF(students, 'Fee Report')} disabled={students.length === 0} className="px-3 sm:px-4 py-2 border border-outline-variant bg-surface-container-lowest text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors flex items-center gap-2 disabled:opacity-50">
            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
          <button onClick={handleExportReport} className="px-3 sm:px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">download</span>
            <span className="hidden sm:inline">Export Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { value: 'fee-summary', label: 'Fee Summary' },
          { value: 'collection', label: 'Collection Report' },
          { value: 'pending', label: 'Pending Dues' },
          { value: 'method', label: 'Payment Methods' },
        ].map((opt) => (
          <button key={opt.value} onClick={() => setReportType(opt.value)} className={`px-3 sm:px-4 py-1.5 rounded-full text-label-md whitespace-nowrap transition-all ${
            reportType === opt.value ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:bg-surface-container-low'
          }`}>
            {opt.label}
          </button>
        ))}
      </div>

      {reportType === 'fee-summary' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <p className="text-label-md text-on-surface-variant">Total Students</p>
            <p className="text-display-lg text-on-surface">{stats.total}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <p className="text-label-md text-on-surface-variant">Total Fee</p>
            <p className="text-display-lg text-on-surface font-mono">PKR {stats.totalFee.toLocaleString()}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <p className="text-label-md text-on-surface-variant">Total Collected</p>
            <p className="text-display-lg text-emerald-600 font-mono">PKR {stats.totalPaid.toLocaleString()}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <p className="text-label-md text-on-surface-variant">Total Pending</p>
            <p className="text-display-lg text-red-600 font-mono">PKR {stats.totalPending.toLocaleString()}</p>
          </div>
        </div>
      )}

      {reportType === 'collection' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
          <h2 className="text-headline-sm text-on-surface mb-4">Collection Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
              <div>
                <p className="text-body-md font-medium text-emerald-800">Paid ({stats.paidCount} students)</p>
                <p className="text-label-md text-emerald-600">{((stats.paidCount / stats.total) * 100 || 0).toFixed(1)}% of students</p>
              </div>
              <p className="text-headline-sm text-emerald-700 font-mono">PKR {stats.totalPaid.toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
              <div>
                <p className="text-body-md font-medium text-amber-800">Partial ({stats.partialCount} students)</p>
                <p className="text-label-md text-amber-600">{((stats.partialCount / stats.total) * 100 || 0).toFixed(1)}% of students</p>
              </div>
              <p className="text-headline-sm text-amber-700 font-mono">PKR {students.filter((r) => r.status?.toLowerCase() === 'partial').reduce((s, r) => s + (parseFloat(r.paid) || 0), 0).toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="text-body-md font-medium text-red-800">Unpaid ({stats.unpaidCount} students)</p>
                <p className="text-label-md text-red-600">{((stats.unpaidCount / stats.total) * 100 || 0).toFixed(1)}% of students</p>
              </div>
              <p className="text-headline-sm text-red-700 font-mono">PKR {stats.totalPending.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {reportType === 'pending' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl">
          <div className="px-6 py-4 border-b border-outline-variant">
            <h2 className="text-headline-sm text-on-surface">Pending Dues</h2>
          </div>
          {students.filter((s) => s.status?.toLowerCase() !== 'paid').length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">check_circle</span>
              <p className="text-body-md text-on-surface-variant">All fees are cleared!</p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {students.filter((s) => s.status?.toLowerCase() !== 'paid').map((s, idx) => (
                <div key={idx} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-label-md flex-shrink-0">
                      {String(s.studentName || '').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                    </div>
                    <div>
                      <p className="text-body-md font-medium text-on-surface">{s.studentName}</p>
                      <p className="text-label-md text-on-surface-variant">{s.studentId} · {s.course}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 sm:text-right ml-11 sm:ml-0">
                    <p className="text-body-md font-mono text-red-600">PKR {(parseFloat(s.pending) || 0).toLocaleString()}</p>
                    <StatusBadge status={s.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {reportType === 'method' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
          <h2 className="text-headline-sm text-on-surface mb-4">Payment Methods Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(stats.methods).length === 0 ? (
              <p className="text-body-md text-on-surface-variant">No payment data available</p>
            ) : (
              Object.entries(stats.methods).map(([method, amount]) => (
                <div key={method} className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                  <span className="text-body-md text-on-surface">{method}</span>
                  <span className="text-body-md font-mono font-medium">PKR {amount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
