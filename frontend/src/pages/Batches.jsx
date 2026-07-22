import { useState, useMemo, useEffect } from 'react';
import { subscribeToBatches, addBatch, updateBatch, deleteBatch } from '../services/batchService';
import { subscribeToCourses } from '../services/courseService';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { validateInput, sanitizeInput } from '../services/securityService';

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [search, setSearch] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [form, setForm] = useState({
    name: '',
    courseName: '',
    startDate: '',
    endDate: '',
    status: 'Active',
  });

  useEffect(() => {
    const unsubBatches = subscribeToBatches((data, err) => {
      if (!err) setBatches(data);
      setLoading(false);
    });
    const unsubCourses = subscribeToCourses((data, err) => {
      if (!err) setCourses(data);
    });
    return () => { if (unsubBatches) unsubBatches(); if (unsubCourses) unsubCourses(); };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return batches;
    const q = search.toLowerCase();
    return batches.filter((b) =>
      (b.name || '').toLowerCase().includes(q) ||
      (b.courseName || '').toLowerCase().includes(q) ||
      (b.status || '').toLowerCase().includes(q)
    );
  }, [batches, search]);

  const activeCount = useMemo(() => batches.filter((b) => b.status === 'Active').length, [batches]);

  const handleAdd = () => {
    const errors = {};
    const nameResult = validateInput(form.name, 'text', { required: true, maxLength: 100 });
    if (!nameResult.valid) errors.name = nameResult.error;
    if (!form.courseName) errors.courseName = 'Course is required';
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    addBatch({
      name: sanitizeInput(form.name.trim()),
      courseName: sanitizeInput(form.courseName),
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
    }).then(() => {
      setAddModal(false);
      setFormErrors({});
      setForm({ name: '', courseName: '', startDate: '', endDate: '', status: 'Active' });
    });
  };

  const handleEdit = () => {
    if (!editModal || !editModal.name) return;
    const errors = {};
    const nameResult = validateInput(editModal.name, 'text', { required: true, maxLength: 100 });
    if (!nameResult.valid) errors.name = nameResult.error;
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    updateBatch(editModal.id, {
      name: sanitizeInput(editModal.name.trim()),
      courseName: sanitizeInput(editModal.courseName || ''),
      startDate: editModal.startDate,
      endDate: editModal.endDate,
      status: editModal.status,
    }).then(() => {
      setEditModal(null);
      setFormErrors({});
    });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this batch?')) return;
    deleteBatch(id);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" text="Loading batches..." /></div>;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md text-on-surface">Batches</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Manage academic batches and their schedules</p>
        </div>
        <button onClick={() => setAddModal(true)} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-lg">add</span>
          Add Batch
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 sm:px-6 py-3 sm:py-4">
          <p className="text-label-sm sm:text-label-md text-on-surface-variant">Total Batches</p>
          <p className="text-headline-sm text-on-surface mt-1">{batches.length}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 sm:px-6 py-3 sm:py-4">
          <p className="text-label-sm sm:text-label-md text-on-surface-variant">Active</p>
          <p className="text-headline-sm text-green-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 sm:px-6 py-3 sm:py-4">
          <p className="text-label-sm sm:text-label-md text-on-surface-variant">Courses</p>
          <p className="text-headline-sm text-on-surface mt-1">{courses.length}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl">
        <div className="px-4 sm:px-6 py-4 border-b border-outline-variant">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-headline-sm text-on-surface">Batch Records</h2>
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input type="search" placeholder="Search batches..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">school</span>
            <p className="text-body-md text-on-surface-variant">No batches found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant">
                    <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider">Batch Name</th>
                    <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider">Course</th>
                    <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider">Start Date</th>
                    <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider">End Date</th>
                    <th className="px-4 py-3 text-center text-table-header text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-table-header text-on-surface-variant uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filtered.map((batch) => (
                    <tr key={batch.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3 text-body-md text-on-surface font-medium">{batch.name}</td>
                      <td className="px-4 py-3 text-body-md text-on-surface-variant">{batch.courseName || '-'}</td>
                      <td className="px-4 py-3 text-body-md text-on-surface">{batch.startDate || '-'}</td>
                      <td className="px-4 py-3 text-body-md text-on-surface">{batch.endDate || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-label-md ${batch.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {batch.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setFormErrors({}); setEditModal({ ...batch }); }} className="p-1 text-on-surface-variant hover:text-primary transition-colors" title="Edit">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button onClick={() => handleDelete(batch.id)} className="p-1 text-on-surface-variant hover:text-error transition-colors" title="Delete">
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-outline-variant">
              {filtered.map((batch) => (
                <div key={batch.id} className="p-4 space-y-2 hover:bg-surface-container-low transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-body-md font-medium text-on-surface">{batch.name}</p>
                      <p className="text-label-md text-on-surface-variant">{batch.courseName || '-'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs flex-shrink-0 ${batch.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {batch.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-label-md text-on-surface-variant">
                      <span>{batch.startDate || '-'}</span>
                      <span className="text-on-surface-variant/50">to</span>
                      <span>{batch.endDate || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setFormErrors({}); setEditModal({ ...batch }); }} className="p-1 text-on-surface-variant hover:text-primary transition-colors" title="Edit">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => handleDelete(batch.id)} className="p-1 text-on-surface-variant hover:text-error transition-colors" title="Delete">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal open={addModal} onClose={() => { setAddModal(false); setFormErrors({}); }} title="Add Batch">
        <div className="space-y-4">
          {Object.keys(formErrors).length > 0 && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-md">
              {Object.values(formErrors).map((err, i) => <p key={i}>{err}</p>)}
            </div>
          )}
          <div>
            <label className="block text-label-md text-on-surface-variant mb-1.5">Batch Name *</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g., 2024-2025" maxLength={100} className={`w-full px-4 py-2.5 bg-surface-bright border rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors ${formErrors.name ? 'border-error' : 'border-outline-variant'}`} />
            {formErrors.name && <p className="text-error text-label-md mt-1">{formErrors.name}</p>}
          </div>
          <div>
            <label className="block text-label-md text-on-surface-variant mb-1.5">Course *</label>
            <select value={form.courseName} onChange={(e) => setForm((f) => ({ ...f, courseName: e.target.value }))} className={`w-full px-4 py-2.5 bg-surface-bright border rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors ${formErrors.courseName ? 'border-error' : 'border-outline-variant'}`}>
              <option value="">Select a course</option>
              {courses.filter((c) => c.status === 'Active').map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            {formErrors.courseName && <p className="text-error text-label-md mt-1">{formErrors.courseName}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-label-md text-on-surface-variant mb-1.5">Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setAddModal(false)} className="px-4 py-2 border border-outline-variant rounded-lg text-label-md hover:bg-surface-container-low transition-colors">Cancel</button>
            <button onClick={handleAdd} disabled={!form.name || !form.courseName} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 disabled:opacity-50">Add Batch</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editModal} onClose={() => { setEditModal(null); setFormErrors({}); }} title="Edit Batch">
        {editModal && (
          <div className="space-y-4">
            {Object.keys(formErrors).length > 0 && (
              <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-md">
                {Object.values(formErrors).map((err, i) => <p key={i}>{err}</p>)}
              </div>
            )}
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Batch Name *</label>
              <input value={editModal.name} onChange={(e) => setEditModal((p) => ({ ...p, name: e.target.value }))} maxLength={100} className={`w-full px-4 py-2.5 bg-surface-bright border rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors ${formErrors.name ? 'border-error' : 'border-outline-variant'}`} />
              {formErrors.name && <p className="text-error text-label-md mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Course *</label>
              <select value={editModal.courseName || ''} onChange={(e) => setEditModal((p) => ({ ...p, courseName: e.target.value }))} className={`w-full px-4 py-2.5 bg-surface-bright border rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors ${formErrors.courseName ? 'border-error' : 'border-outline-variant'}`}>
                <option value="">Select a course</option>
                {courses.filter((c) => c.status === 'Active').map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              {formErrors.courseName && <p className="text-error text-label-md mt-1">{formErrors.courseName}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Start Date</label>
                <input type="date" value={editModal.startDate || ''} onChange={(e) => setEditModal((p) => ({ ...p, startDate: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">End Date</label>
                <input type="date" value={editModal.endDate || ''} onChange={(e) => setEditModal((p) => ({ ...p, endDate: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Status</label>
              <select value={editModal.status || 'Active'} onChange={(e) => setEditModal((p) => ({ ...p, status: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
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
