import { useState, useMemo, useEffect } from 'react';
import { useExcel } from '../hooks/useExcel';
import { getInstallments, addInstallment, updateInstallment, deleteInstallment } from '../services/financialService';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { validateInput, sanitizeInput } from '../services/securityService';

function computeNextDueDate(startDate, frequency) {
  if (!startDate) return null;
  const d = new Date(startDate);
  switch (frequency) {
    case 'Weekly': d.setDate(d.getDate() + 7); break;
    case 'Bi-Weekly': d.setDate(d.getDate() + 14); break;
    case 'Monthly': d.setMonth(d.getMonth() + 1); break;
    case 'Quarterly': d.setMonth(d.getMonth() + 3); break;
    default: d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString().split('T')[0];
}

function deriveInstallmentCount(plan) {
  let count = 0;
  if ((plan.installment1 || 0) > 0) count++;
  if ((plan.installment2 || 0) > 0) count++;
  if ((plan.installment3 || 0) > 0) count++;
  return count || 1;
}

export default function InstallmentPlans() {
  const { students, loading } = useExcel();
  const [plans, setPlans] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    studentId: '', totalAmount: '', installmentCount: '3', frequency: 'Monthly', startDate: new Date().toISOString().split('T')[0]
  });

  const refresh = () => getInstallments().then(setPlans).catch(() => setPlans([]));

  useEffect(() => { if (!loading) refresh(); }, [loading]);

  const filtered = useMemo(() => {
    let data = plans;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((p) => (p.studentId || '').toLowerCase().includes(q) || (p.studentName || '').toLowerCase().includes(q));
    }
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [plans, search]);

  const [formErrors, setFormErrors] = useState({});

  const handleAdd = () => {
    const errors = {};
    const studentResult = validateInput(form.studentId, 'text', { required: true });
    if (!studentResult.valid) errors.studentId = 'Please select a student';
    const totalResult = validateInput(String(form.totalAmount), 'number', { required: true, min: 1, max: 100000000 });
    if (!totalResult.valid) errors.totalAmount = totalResult.error;
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    const student = students.find((s) => s.studentId === form.studentId);
    const total = parseFloat(form.totalAmount) || 0;
    const count = Math.min(parseInt(form.installmentCount) || 1, 3);
    const perInstallment = total / count;

    const dueDate1 = form.startDate || null;
    const dueDate2 = computeNextDueDate(form.startDate, form.frequency);
    const dueDate3 = computeNextDueDate(dueDate2, form.frequency);

    addInstallment({
      studentId: sanitizeInput(form.studentId),
      studentName: sanitizeInput(student ? student.studentName : 'N/A'),
      totalAmount: total,
      installment1: perInstallment,
      installment2: count >= 2 ? perInstallment : 0,
      installment3: count >= 3 ? perInstallment : 0,
      dueDate1: dueDate1,
      dueDate2: count >= 2 ? dueDate2 : null,
      dueDate3: count >= 3 ? dueDate3 : null,
      status: 'Pending',
    }).then(() => refresh());
    setAddModal(false);
    setFormErrors({});
    setForm({ studentId: '', totalAmount: '', installmentCount: '3', frequency: 'Monthly', startDate: new Date().toISOString().split('T')[0] });
  };

  const handleEdit = () => {
    if (!editModal) return;
    const total = parseFloat(editModal.totalAmount) || 0;
    const count = deriveInstallmentCount(editModal);
    const perInstallment = total / count;
    updateInstallment(editModal.id, {
      totalAmount: total,
      status: editModal.status,
      installment1: perInstallment,
      installment2: count >= 2 ? perInstallment : 0,
      installment3: count >= 3 ? perInstallment : 0,
    }).then(() => refresh());
    setEditModal(null);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this installment plan?')) return;
    deleteInstallment(id).then(() => refresh());
  };

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" text="Loading plans..." /></div>;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md text-on-surface">Installment Plans</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Manage student fee installment schedules</p>
        </div>
        <button onClick={() => setAddModal(true)} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-lg">add</span>
          New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-6 py-4">
          <p className="text-label-md text-on-surface-variant">Total Plans</p>
          <p className="text-headline-sm text-on-surface mt-1">{plans.length}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-6 py-4">
          <p className="text-label-md text-on-surface-variant">Active Plans</p>
          <p className="text-headline-sm text-emerald-600 mt-1">{plans.filter((p) => p.status === 'Pending').length}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-6 py-4">
          <p className="text-label-md text-on-surface-variant">Completed Plans</p>
          <p className="text-headline-sm text-blue-600 mt-1">{plans.filter((p) => p.status === 'Paid').length}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl">
        <div className="px-4 sm:px-6 py-4 border-b border-outline-variant">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-headline-sm text-on-surface">All Plans</h2>
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input type="search" placeholder="Search plans..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">schedule</span>
            <p className="text-body-md text-on-surface-variant">No installment plans yet</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {filtered.map((plan) => {
              const installmentCount = deriveInstallmentCount(plan);
              const perInstallment = (plan.installment1 || 0);
              const paidAmount = plan.status === 'Paid' ? (plan.totalAmount || 0) : 0;
              const progress = plan.totalAmount > 0 ? ((paidAmount / plan.totalAmount) * 100).toFixed(1) : 0;
              return (
                <div key={plan.id} className="px-6 py-4 hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-blue-600">schedule</span>
                      </div>
                      <div>
                        <p className="text-body-md font-medium text-on-surface">{plan.studentName || plan.studentId}</p>
                        <p className="text-label-md text-on-surface-variant">{plan.studentId} | {installmentCount} installments</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-label-md ${plan.status === 'Pending' ? 'bg-emerald-50 text-emerald-700' : plan.status === 'Paid' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>{plan.status}</span>
                      <button onClick={() => setEditModal({ ...plan })} className="p-1 text-on-surface-variant hover:text-primary transition-colors" title="Edit">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => handleDelete(plan.id)} className="p-1 text-on-surface-variant hover:text-error transition-colors" title="Delete">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-label-md text-on-surface-variant">
                    <span>Total: PKR {(plan.totalAmount || 0).toLocaleString()}</span>
                    <span>Paid: PKR {paidAmount.toLocaleString()}</span>
                    <span>Per Installment: PKR {perInstallment.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(100, progress)}%` }} />
                  </div>
                  <p className="text-label-md text-on-surface-variant mt-1">{progress}% completed</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={addModal} onClose={() => { setAddModal(false); setFormErrors({}); }} title="New Installment Plan">
        <div className="space-y-4">
          {Object.keys(formErrors).length > 0 && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-md">
              {Object.values(formErrors).map((err, i) => <p key={i}>{err}</p>)}
            </div>
          )}
          <div>
            <label className="block text-label-md text-on-surface-variant mb-1.5">Student</label>
            <select value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))} className={`w-full px-4 py-2.5 bg-surface-bright border rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors ${formErrors.studentId ? 'border-error' : 'border-outline-variant'}`}>
              <option value="">Select student</option>
              {students.map((s) => <option key={s.studentId} value={s.studentId}>{s.studentId} - {s.studentName}</option>)}
            </select>
            {formErrors.studentId && <p className="text-error text-label-md mt-1">{formErrors.studentId}</p>}
          </div>
          <div>
            <label className="block text-label-md text-on-surface-variant mb-1.5">Total Amount (PKR)</label>
            <input type="number" value={form.totalAmount} onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))} placeholder="0" className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Number of Installments (max 3)</label>
              <input type="number" value={form.installmentCount} onChange={(e) => setForm((f) => ({ ...f, installmentCount: e.target.value }))} min="1" max="3" className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Frequency</label>
              <select value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors">
                <option>Weekly</option><option>Bi-Weekly</option><option>Monthly</option><option>Quarterly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-label-md text-on-surface-variant mb-1.5">Start Date</label>
            <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setAddModal(false)} className="px-4 py-2 border border-outline-variant rounded-lg text-label-md hover:bg-surface-container-low transition-colors">Cancel</button>
            <button onClick={handleAdd} disabled={!form.studentId || !form.totalAmount} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 disabled:opacity-50">Create Plan</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Installment Plan">
        {editModal && (
          <div className="space-y-4">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Student</label>
              <input value={`${editModal.studentId} - ${editModal.studentName || ''}`} readOnly className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-lg text-body-md cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Total Amount (PKR)</label>
              <input type="number" value={editModal.totalAmount} onChange={(e) => setEditModal((p) => ({ ...p, totalAmount: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Status</label>
              <select value={editModal.status} onChange={(e) => setEditModal((p) => ({ ...p, status: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors">
                <option>Pending</option><option>Paid</option><option>Overdue</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setEditModal(null)} className="px-4 py-2 border border-outline-variant rounded-lg text-label-md hover:bg-surface-container-low transition-colors">Cancel</button>
              <button onClick={handleEdit} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95">Save Changes</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
