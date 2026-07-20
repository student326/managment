import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExcel } from '../hooks/useExcel';
import { addStudentToWorkbook } from '../services/excelService';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AddStudent() {
  const { wb, saveWorkbook, loading: dataLoading } = useExcel();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [now, setNow] = useState(new Date());
  const [form, setForm] = useState({
    studentName: '',
    fatherName: '',
    phone: '',
    email: '',
    course: 'Grade 9',
    batch: '2024-2025',
    totalFee: '',
    paid: '',
    remaining: 0,
    status: 'Unpaid',
    paymentMethod: 'Cash',
    remarks: '',
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const total = parseFloat(form.totalFee) || 0;
    const paid = parseFloat(form.paid) || 0;
    const remaining = Math.max(0, total - paid);
    setForm((prev) => ({
      ...prev,
      remaining,
      status: remaining <= 0 && paid > 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid',
    }));
  }, [form.totalFee, form.paid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!wb) return;
    setSaving(true);
    try {
      addStudentToWorkbook(wb, {
        studentName: form.studentName,
        fatherName: form.fatherName,
        phone: form.phone,
        email: form.email,
        course: form.course,
        batch: form.batch,
        admissionDate: now.toISOString().split('T')[0],
        totalFee: parseFloat(form.totalFee) || 0,
        paid: parseFloat(form.paid) || 0,
        pending: form.remaining,
        status: form.status,
        paymentMethod: form.paymentMethod,
        paymentDate: now.toISOString().split('T')[0],
        remarks: form.remarks,
      });
      await saveWorkbook(wb);
      setSaved(true);
      setTimeout(() => {
        navigate('/students');
      }, 1500);
    } catch (err) {
      console.error('Failed to add student:', err);
    } finally {
      setSaving(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (saved) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4 animate-scale-in">
          <span className="material-symbols-outlined text-6xl text-emerald-500">check_circle</span>
          <h2 className="text-headline-md text-on-surface">Student Record Saved</h2>
          <p className="text-body-md text-on-surface-variant">Redirecting to student records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-headline-md text-on-surface">Add Student Record</h1>
        <p className="text-body-md text-on-surface-variant mt-1">Fill in the details below to add a new student</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">badge</span>
              <h2 className="text-headline-sm text-on-surface">Basic Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Student Name</label>
                <input
                  name="studentName"
                  value={form.studentName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Father Name</label>
                <input
                  name="fatherName"
                  value={form.fatherName}
                  onChange={handleChange}
                  placeholder="Enter father name"
                  required
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Phone Number</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="03XX-XXXXXXX"
                  required
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="student@example.com"
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Course/Class</label>
                <select
                  name="course"
                  value={form.course}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors"
                >
                  <option>Grade 9</option>
                  <option>Grade 10</option>
                  <option>FSc Pre-Medical Part 1</option>
                  <option>FSc Pre-Medical Part 2</option>
                  <option>ICS Part 1</option>
                  <option>ICS Part 2</option>
                </select>
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Batch</label>
                <input
                  name="batch"
                  value={form.batch}
                  onChange={handleChange}
                  placeholder="e.g., 2024-2025"
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">calendar_today</span>
              <h2 className="text-headline-sm text-on-surface">Admission Date</h2>
            </div>
            <p className="text-display-lg text-primary font-semibold">
              {now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <p className="text-body-md text-on-surface-variant mt-1">
              {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>

          <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
              <h2 className="text-headline-sm text-on-surface">Financial Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Total Fee (PKR)</label>
                <input
                  name="totalFee"
                  type="number"
                  value={form.totalFee}
                  onChange={handleChange}
                  placeholder="0"
                  required
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Paid Amount (PKR)</label>
                <input
                  name="paid"
                  type="number"
                  value={form.paid}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Remaining Amount</label>
                <div className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-lg text-body-md text-on-surface font-mono">
                  PKR {form.remaining.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-label-md text-on-surface-variant mb-1.5">Fee Status</label>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container">
                <span className={`px-3 py-1 rounded-full text-status-badge ${
                  form.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                  form.status === 'Partial' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>{form.status}</span>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-label-md text-on-surface-variant mb-3">Payment Method</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'Cash', icon: 'payments' },
                  { value: 'Bank Transfer', icon: 'account_balance' },
                  { value: 'JazzCash', icon: 'smartphone' },
                  { value: 'EasyPaisa', icon: 'send_to_mobile' },
                ].map((method) => (
                  <label
                    key={method.value}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                      form.paymentMethod === method.value
                        ? 'border-primary bg-primary-fixed text-primary font-bold'
                        : 'border-outline-variant bg-surface-bright text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={form.paymentMethod === method.value}
                      onChange={handleChange}
                      className="hidden peer"
                    />
                    <span className="material-symbols-outlined">{method.icon}</span>
                    <span className="text-label-md text-center">{method.value}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">notes</span>
              <h2 className="text-headline-sm text-on-surface">Remarks</h2>
            </div>
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              placeholder="Any additional notes..."
              rows={6}
              className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors resize-none"
            />
            <button
              type="submit"
              disabled={saving || !form.studentName || !form.fatherName || !form.phone}
              className="w-full mt-6 py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? <LoadingSpinner size="sm" /> : <span className="material-symbols-outlined text-lg">save</span>}
              Save Student Record
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
