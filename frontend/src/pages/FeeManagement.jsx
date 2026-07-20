import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExcel } from '../hooks/useExcel';
import { updateStudentInWorkbook } from '../services/excelService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function FeeManagement() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { wb, students, loading, saveWorkbook } = useExcel();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [payment, setPayment] = useState({ amount: '', method: 'Cash', date: new Date().toISOString().split('T')[0] });

  const student = useMemo(() => students.find((s) => s.studentId === studentId), [students, studentId]);

  const handlePay = async () => {
    if (!wb || !student || !payment.amount) return;
    setSaving(true);
    try {
      const currentPaid = parseFloat(student.paid) || 0;
      const newPaid = currentPaid + parseFloat(payment.amount);
      updateStudentInWorkbook(wb, student.studentId, {
        paid: newPaid,
        paymentMethod: payment.method,
        paymentDate: payment.date,
      });
      await saveWorkbook(wb);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setPayment({ amount: '', method: 'Cash', date: new Date().toISOString().split('T')[0] });
    } catch (err) {
      console.error('Payment failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const feeHistory = useMemo(() => {
    if (!student) return [];
    const total = parseFloat(student.totalFee) || 0;
    const paid = parseFloat(student.paid) || 0;
    const history = [];
    if (paid > 0) {
      history.push({
        date: student.paymentDate || 'N/A',
        amount: paid,
        method: student.paymentMethod || 'Cash',
        type: 'Payment',
      });
    }
    if (total > 0) {
      history.push({
        date: student.admissionDate || 'N/A',
        amount: total,
        method: 'Enrollment',
        type: 'Fee Assigned',
      });
    }
    return history.reverse();
  }, [student]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">error</span>
        <h2 className="text-headline-md text-on-surface">Student Not Found</h2>
        <button onClick={() => navigate('/students')} className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg">Back to Students</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md text-on-surface">Fee Management</h1>
          <p className="text-body-md text-on-surface-variant mt-1">{student.studentId} - {student.studentName}</p>
        </div>
        <button onClick={() => navigate('/students')} className="px-4 py-2 border border-outline-variant rounded-lg text-label-md hover:bg-surface-container-low transition-colors self-start sm:self-auto">Back to Records</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <h2 className="text-headline-sm text-on-surface mb-4">Student Info</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-body-md text-on-surface-variant">Name</span>
                <span className="text-body-md text-on-surface font-medium">{student.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-md text-on-surface-variant">Course</span>
                <span className="text-body-md text-on-surface">{student.course || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-md text-on-surface-variant">Total Fee</span>
                <span className="text-body-md font-mono">PKR {(parseFloat(student.totalFee) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-md text-on-surface-variant">Paid</span>
                <span className="text-body-md font-mono text-emerald-600">PKR {(parseFloat(student.paid) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-md text-on-surface-variant">Pending</span>
                <span className="text-body-md font-mono text-red-600">PKR {(parseFloat(student.pending) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-md text-on-surface-variant">Status</span>
                <StatusBadge status={student.status} />
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <h2 className="text-headline-sm text-on-surface mb-4">Record Payment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Amount (PKR)</label>
                <input
                  type="number"
                  value={payment.amount}
                  onChange={(e) => setPayment((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="Enter payment amount"
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Payment Method</label>
                <select
                  value={payment.method}
                  onChange={(e) => setPayment((p) => ({ ...p, method: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors"
                >
                  <option>Cash</option><option>Bank Transfer</option><option>JazzCash</option><option>EasyPaisa</option>
                </select>
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Payment Date</label>
                <input
                  type="date"
                  value={payment.date}
                  onChange={(e) => setPayment((p) => ({ ...p, date: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors"
                />
              </div>
              <button
                onClick={handlePay}
                disabled={saving || !payment.amount}
                className="w-full py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <LoadingSpinner size="sm" /> : <span className="material-symbols-outlined text-lg">payments</span>}
                Record Payment
              </button>
              {saved && (
                <p className="text-emerald-600 text-body-md flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Payment recorded successfully
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl">
            <div className="px-6 py-4 border-b border-outline-variant">
              <h2 className="text-headline-sm text-on-surface">Fee History</h2>
            </div>
            {feeHistory.length === 0 ? (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">receipt_long</span>
                <p className="text-body-md text-on-surface-variant">No fee history available</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant">
                {feeHistory.map((entry, idx) => (
                  <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        entry.type === 'Payment' ? 'bg-emerald-50' : 'bg-blue-50'
                      }`}>
                        <span className={`material-symbols-outlined ${
                          entry.type === 'Payment' ? 'text-emerald-600' : 'text-blue-600'
                        }`}>
                          {entry.type === 'Payment' ? 'payments' : 'assignment'}
                        </span>
                      </div>
                      <div>
                        <p className="text-body-md font-medium text-on-surface">{entry.type}</p>
                        <p className="text-label-md text-on-surface-variant">{entry.date} · {entry.method}</p>
                      </div>
                    </div>
                    <span className={`font-mono font-semibold ${
                      entry.type === 'Payment' ? 'text-emerald-600' : 'text-on-surface'
                    }`}>
                      PKR {entry.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
