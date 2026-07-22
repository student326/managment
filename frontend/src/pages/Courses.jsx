import { useState, useMemo, useEffect } from 'react';
import { subscribeToCourses, addCourse, updateCourse, deleteCourse } from '../services/courseService';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { validateInput, sanitizeInput } from '../services/securityService';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', fee: '', status: 'Active' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const unsubscribe = subscribeToCourses((data, error) => {
      if (!error) setCourses(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filtered = useMemo(() => {
    if (!search) return courses;
    const q = search.toLowerCase();
    return courses.filter(
      (c) => (c.name || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
    );
  }, [courses, search]);

  const activeCount = useMemo(() => courses.filter((c) => c.status === 'Active').length, [courses]);

  const handleAdd = () => {
    const errors = {};
    const nameResult = validateInput(form.name, 'text', { required: true, maxLength: 150 });
    if (!nameResult.valid) errors.name = nameResult.error;
    const feeResult = validateInput(String(form.fee), 'number', { required: true, min: 0, max: 100000000 });
    if (!feeResult.valid) errors.fee = feeResult.error;
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    addCourse({
      name: sanitizeInput(form.name.trim()),
      description: sanitizeInput((form.description || '').trim()),
      fee: parseFloat(form.fee),
      status: form.status,
    }).then(() => setCourses((prev) => prev));
    setAddModal(false);
    setFormErrors({});
    setForm({ name: '', description: '', fee: '', status: 'Active' });
  };

  const handleEdit = () => {
    if (!editModal || !editModal.name) return;
    updateCourse(editModal.id, {
      name: sanitizeInput(editModal.name.trim()),
      description: sanitizeInput((editModal.description || '').trim()),
      fee: parseFloat(editModal.fee),
      status: editModal.status,
    });
    setEditModal(null);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this course?')) return;
    deleteCourse(id);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" text="Loading courses..." /></div>;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md text-on-surface">Courses</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Manage courses and their fee structures</p>
        </div>
        <button onClick={() => setAddModal(true)} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-lg">add</span>
          Add Course
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 sm:px-6 py-3 sm:py-4">
          <p className="text-label-sm sm:text-label-md text-on-surface-variant">Total Courses</p>
          <p className="text-headline-sm text-on-surface mt-1">{courses.length}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 sm:px-6 py-3 sm:py-4">
          <p className="text-label-sm sm:text-label-md text-on-surface-variant">Active</p>
          <p className="text-headline-sm text-green-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 sm:px-6 py-3 sm:py-4">
          <p className="text-label-sm sm:text-label-md text-on-surface-variant">Inactive</p>
          <p className="text-headline-sm text-on-surface-variant mt-1">{courses.length - activeCount}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl">
        <div className="px-4 sm:px-6 py-4 border-b border-outline-variant">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-headline-sm text-on-surface">All Courses</h2>
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input type="search" placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">school</span>
            <p className="text-body-md text-on-surface-variant">No courses found</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant">
                    <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-right text-table-header text-on-surface-variant uppercase tracking-wider">Fee</th>
                    <th className="px-4 py-3 text-center text-table-header text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-table-header text-on-surface-variant uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filtered.map((course) => (
                    <tr key={course.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3 text-body-md text-on-surface font-medium">{course.name}</td>
                      <td className="px-4 py-3 text-body-md text-on-surface-variant max-w-xs truncate">{course.description || '-'}</td>
                      <td className="px-4 py-3 text-body-md font-mono text-right font-semibold text-on-surface">PKR {(parseFloat(course.fee) || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-label-md ${course.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{course.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setEditModal({ ...course })} className="p-1 text-on-surface-variant hover:text-primary transition-colors" title="Edit">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button onClick={() => handleDelete(course.id)} className="p-1 text-on-surface-variant hover:text-error transition-colors" title="Delete">
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-outline-variant">
              {filtered.map((course) => (
                <div key={course.id} className="p-4 space-y-2 hover:bg-surface-container-low transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-body-md font-medium text-on-surface">{course.name}</p>
                      <p className="text-label-md text-on-surface-variant truncate">{course.description || 'No description'}</p>
                    </div>
                    <span className={`ml-2 flex-shrink-0 px-2 py-0.5 rounded-full text-xs ${course.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{course.status}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-body-md font-mono font-semibold text-on-surface">PKR {(parseFloat(course.fee) || 0).toLocaleString()}</p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditModal({ ...course })} className="p-1 text-on-surface-variant hover:text-primary transition-colors" title="Edit">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => handleDelete(course.id)} className="p-1 text-on-surface-variant hover:text-error transition-colors" title="Delete">
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

      <Modal open={addModal} onClose={() => { setAddModal(false); setFormErrors({}); }} title="Add Course">
        <div className="space-y-4">
          {Object.keys(formErrors).length > 0 && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-md">
              {Object.values(formErrors).map((err, i) => <p key={i}>{err}</p>)}
            </div>
          )}
          <div>
            <label className="block text-label-md text-on-surface-variant mb-1.5">Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g., Matric Science" maxLength={150} className={`w-full px-4 py-2.5 bg-surface-bright border rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors ${formErrors.name ? 'border-error' : 'border-outline-variant'}`} />
            {formErrors.name && <p className="text-error text-label-md mt-1">{formErrors.name}</p>}
          </div>
          <div>
            <label className="block text-label-md text-on-surface-variant mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional course description" rows={3} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Fee (PKR)</label>
              <input type="number" value={form.fee} onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))} placeholder="0" className={`w-full px-4 py-2.5 bg-surface-bright border rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors ${formErrors.fee ? 'border-error' : 'border-outline-variant'}`} />
              {formErrors.fee && <p className="text-error text-label-md mt-1">{formErrors.fee}</p>}
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setAddModal(false)} className="px-4 py-2 border border-outline-variant rounded-lg text-label-md hover:bg-surface-container-low transition-colors">Cancel</button>
            <button onClick={handleAdd} disabled={!form.name || !form.fee} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 disabled:opacity-50">Add Course</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Course">
        {editModal && (
          <div className="space-y-4">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Name</label>
              <input value={editModal.name} onChange={(e) => setEditModal((p) => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Description</label>
              <textarea value={editModal.description || ''} onChange={(e) => setEditModal((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors resize-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Fee (PKR)</label>
                <input type="number" value={editModal.fee} onChange={(e) => setEditModal((p) => ({ ...p, fee: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Status</label>
                <select value={editModal.status} onChange={(e) => setEditModal((p) => ({ ...p, status: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
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
