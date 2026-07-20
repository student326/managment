import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExcel } from '../hooks/useExcel';
import { updateStudentInWorkbook } from '../services/excelService';
import LoadingSpinner from '../components/LoadingSpinner';

export default function EditStudent() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { wb, students, loading, saveWorkbook } = useExcel();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const student = useMemo(() => students.find((s) => s.studentId === studentId), [students, studentId]);

  const [form, setForm] = useState({
    studentName: '',
    fatherName: '',
    phone: '',
    email: '',
    course: '',
    batch: '',
    totalFee: '',
    paid: '',
    pending: 0,
    status: '',
    paymentMethod: '',
    paymentDate: '',
    remarks: '',
  });

  useEffect(() => {
    if (student) {
      setForm({
        studentName: student.studentName || '',
        fatherName: student.fatherName || '',
        phone: student.phone || '',
        email: student.email || '',
        course: student.course || '',
        batch: student.batch || '',
        totalFee: student.totalFee || '',
        paid: student.paid || '',
        pending: student.pending || 0,
        status: student.status || '',
        paymentMethod: student.paymentMethod || '',
        paymentDate: student.paymentDate || '',
        remarks: student.remarks || '',
      });
    }
  }, [student]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'totalFee' || name === 'paid') {
        const total = parseFloat(name === 'totalFee' ? value : prev.totalFee) || 0;
        const paid = parseFloat(name === 'paid' ? value : prev.paid) || 0;
        const remaining = Math.max(0, total - paid);
        updated.pending = remaining;
        updated.status = remaining <= 0 && paid > 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!wb || !student) return;
    setSaving(true);
    try {
      updateStudentInWorkbook(wb, student.studentId, {
        studentName: form.studentName,
        fatherName: form.fatherName,
        phone: form.phone,
        email: form.email,
        course: form.course,
        batch: form.batch,
        totalFee: parseFloat(form.totalFee) || 0,
        paid: parseFloat(form.paid) || 0,
        pending: form.pending,
        status: form.status,
        paymentMethod: form.paymentMethod,
        paymentDate: form.paymentDate,
        remarks: form.remarks,
      });
      await saveWorkbook(wb);
      setSaved(true);
      setTimeout(() => navigate('/students'), 1000);
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" text="Loading student data..." />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">error</span>
        <h2 className="text-headline-md text-on-surface">Student Not Found</h2>
        <p className="text-body-md text-on-surface-variant mt-1">No student with ID "{studentId}" exists.</p>
        <button onClick={() => navigate('/students')} className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg">Back to Students</button>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4 animate-scale-in">
          <span className="material-symbols-outlined text-6xl text-emerald-500">check_circle</span>
          <h2 className="text-headline-md text-on-surface">Student Updated</h2>
          <p className="text-body-md text-on-surface-variant">Redirecting to student records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md text-on-surface">Edit Student</h1>
          <p className="text-body-md text-on-surface-variant mt-1">{student.studentId} - {student.studentName}</p>
        </div>
        <button onClick={() => navigate('/students')} className="px-4 py-2 border border-outline-variant rounded-lg text-label-md hover:bg-surface-container-low transition-colors self-start sm:self-auto">
          Back to Records
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Student Name</label>
              <input name="studentName" value={form.studentName} onChange={handleChange} required className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Father Name</label>
              <input name="fatherName" value={form.fatherName} onChange={handleChange} required className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} required className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Course</label>
              <select name="course" value={form.course} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors">
                <option>Grade 9</option><option>Grade 10</option>
                <option>FSc Pre-Medical Part 1</option><option>FSc Pre-Medical Part 2</option>
                <option>ICS Part 1</option><option>ICS Part 2</option>
              </select>
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Batch</label>
              <input name="batch" value={form.batch} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
            </div>
          </div>

          <div className="border-t border-outline-variant pt-6">
            <h3 className="text-headline-sm text-on-surface mb-4">Fee Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Total Fee (PKR)</label>
                <input name="totalFee" type="number" value={form.totalFee} onChange={handleChange} required className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Paid Amount (PKR)</label>
                <input name="paid" type="number" value={form.paid} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Pending Amount</label>
                <div className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-lg text-body-md font-mono">PKR {form.pending.toLocaleString()}</div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-label-md text-on-surface-variant mb-1.5">Payment Method</label>
              <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors">
                <option>Cash</option><option>Bank Transfer</option><option>JazzCash</option><option>EasyPaisa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-label-md text-on-surface-variant mb-1.5">Remarks</label>
            <textarea name="remarks" value={form.remarks} onChange={handleChange} rows={3} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors resize-none" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate('/students')} className="px-4 py-2 border border-outline-variant rounded-lg text-label-md hover:bg-surface-container-low transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2">
              {saving ? <LoadingSpinner size="sm" /> : null}
              Update Student
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
