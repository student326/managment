import { useState, useMemo } from 'react';
import { useExcel } from '../hooks/useExcel';
import { getExpenses, addExpense, updateExpense, deleteExpense } from '../services/financialService';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = ['Salary', 'Rent', 'Utilities', 'Supplies', 'Maintenance', 'Marketing', 'Transport', 'Other'];

export default function ExpenseTracking() {
  const { loading } = useExcel();
  const [expenses, setExpenses] = useState(() => getExpenses());
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ description: '', amount: '', category: 'Salary', method: 'Cash', date: new Date().toISOString().split('T')[0], notes: '' });

  const refresh = () => setExpenses(getExpenses());

  const filtered = useMemo(() => {
    let data = expenses;
    if (filter !== 'All') data = data.filter((e) => e.category === filter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((e) => (e.description || '').toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q));
    }
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [expenses, filter, search]);

  const totalExpenses = filtered.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  const handleAdd = () => {
    if (!form.description || !form.amount || parseFloat(form.amount) <= 0) return;
    addExpense({ ...form, amount: parseFloat(form.amount) });
    refresh();
    setAddModal(false);
    setForm({ description: '', amount: '', category: 'Salary', method: 'Cash', date: new Date().toISOString().split('T')[0], notes: '' });
  };

  const handleEdit = () => {
    if (!editModal || !editModal.description || !editModal.amount) return;
    updateExpense(editModal.id, { ...editModal, amount: parseFloat(editModal.amount) });
    refresh();
    setEditModal(null);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this expense?')) return;
    deleteExpense(id);
    refresh();
  };

  const categoryTotals = useMemo(() => {
    const totals = {};
    expenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + (parseFloat(e.amount) || 0);
    });
    return totals;
  }, [expenses]);

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" text="Loading expenses..." /></div>;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md text-on-surface">Expense Tracking</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Track and manage office expenses</p>
        </div>
        <button onClick={() => setAddModal(true)} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-lg">add</span>
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 sm:px-6 py-3 sm:py-4">
          <p className="text-label-sm sm:text-label-md text-on-surface-variant">Total Expenses</p>
          <p className="text-headline-sm text-red-600 font-mono mt-1">PKR {totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 sm:px-6 py-3 sm:py-4">
          <p className="text-label-sm sm:text-label-md text-on-surface-variant">Total Records</p>
          <p className="text-headline-sm text-on-surface mt-1">{expenses.length}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 sm:px-6 py-3 sm:py-4">
          <p className="text-label-sm sm:text-label-md text-on-surface-variant">Categories</p>
          <p className="text-headline-sm text-on-surface mt-1">{Object.keys(categoryTotals).length}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 sm:px-6 py-3 sm:py-4">
          <p className="text-label-sm sm:text-label-md text-on-surface-variant">This Month</p>
          <p className="text-headline-sm text-on-surface font-mono mt-1">
            PKR {expenses.filter((e) => {
              const d = new Date(e.date || e.createdAt);
              const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {Object.keys(categoryTotals).length > 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 sm:p-6">
          <h2 className="text-headline-sm text-on-surface mb-4">Expenses by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([cat, total]) => (
              <div key={cat} className="bg-surface-container-low rounded-lg p-3 sm:p-4">
                <p className="text-label-md text-on-surface-variant">{cat}</p>
                <p className="text-headline-sm text-on-surface font-mono mt-1">PKR {total.toLocaleString()}</p>
                <div className="mt-2 w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(total / totalExpenses) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', ...CATEGORIES].map((opt) => (
          <button key={opt} onClick={() => setFilter(opt)} className={`px-3 sm:px-4 py-1.5 rounded-full text-label-md whitespace-nowrap transition-all ${filter === opt ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:bg-surface-container-low'}`}>
            {opt}
          </button>
        ))}
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl">
        <div className="px-4 sm:px-6 py-4 border-b border-outline-variant">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-headline-sm text-on-surface">Expense Records</h2>
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input type="search" placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">receipt</span>
            <p className="text-body-md text-on-surface-variant">No expenses recorded</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant">
                    <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider hidden lg:table-cell">Method</th>
                    <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider hidden xl:table-cell">Notes</th>
                    <th className="px-4 py-3 text-right text-table-header text-on-surface-variant uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-center text-table-header text-on-surface-variant uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filtered.map((exp) => (
                    <tr key={exp.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3 text-body-md text-on-surface">{exp.date || '-'}</td>
                      <td className="px-4 py-3 text-body-md text-on-surface font-medium">{exp.description}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-label-md bg-red-50 text-red-700">{exp.category}</span>
                      </td>
                      <td className="px-4 py-3 text-body-md text-on-surface hidden lg:table-cell">{exp.method || '-'}</td>
                      <td className="px-4 py-3 text-body-md text-on-surface-variant max-w-[200px] truncate hidden xl:table-cell">{exp.notes || '-'}</td>
                      <td className="px-4 py-3 text-body-md font-mono text-right font-semibold text-red-600">PKR {(parseFloat(exp.amount) || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setEditModal({ ...exp })} className="p-1 text-on-surface-variant hover:text-primary transition-colors" title="Edit">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button onClick={() => handleDelete(exp.id)} className="p-1 text-on-surface-variant hover:text-error transition-colors" title="Delete">
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
              {filtered.map((exp) => (
                <div key={exp.id} className="p-4 space-y-2 hover:bg-surface-container-low transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-body-md font-medium text-on-surface">{exp.description}</p>
                      <p className="text-label-md text-on-surface-variant">{exp.date || '-'} · {exp.method || '-'}</p>
                    </div>
                    <p className="text-body-md font-mono font-semibold text-red-600 ml-2 flex-shrink-0">PKR {(parseFloat(exp.amount) || 0).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700">{exp.category}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditModal({ ...exp })} className="p-1 text-on-surface-variant hover:text-primary transition-colors" title="Edit">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => handleDelete(exp.id)} className="p-1 text-on-surface-variant hover:text-error transition-colors" title="Delete">
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

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Expense">
        <div className="space-y-4">
          <div>
            <label className="block text-label-md text-on-surface-variant mb-1.5">Description</label>
            <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="e.g., Office electricity bill" className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Amount (PKR)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Payment Method</label>
              <select value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors">
                <option>Cash</option><option>Bank Transfer</option><option>Cheque</option><option>Online</option>
              </select>
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-label-md text-on-surface-variant mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." rows={2} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors resize-none" />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setAddModal(false)} className="px-4 py-2 border border-outline-variant rounded-lg text-label-md hover:bg-surface-container-low transition-colors">Cancel</button>
            <button onClick={handleAdd} disabled={!form.description || !form.amount} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 disabled:opacity-50">Add Expense</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Expense">
        {editModal && (
          <div className="space-y-4">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Description</label>
              <input value={editModal.description} onChange={(e) => setEditModal((p) => ({ ...p, description: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Amount (PKR)</label>
                <input type="number" value={editModal.amount} onChange={(e) => setEditModal((p) => ({ ...p, amount: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1.5">Category</label>
                <select value={editModal.category} onChange={(e) => setEditModal((p) => ({ ...p, category: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
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
