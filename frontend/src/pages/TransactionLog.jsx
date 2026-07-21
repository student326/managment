import { useState, useMemo } from 'react';
import { useExcel } from '../hooks/useExcel';
import { getTransactions, addTransaction, deleteTransaction } from '../services/financialService';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { validateInput, sanitizeInput } from '../services/securityService';

export default function TransactionLog() {
  const { students, loading } = useExcel();
  const [txList, setTxList] = useState(() => getTransactions());
  const [addModal, setAddModal] = useState(false);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [form, setForm] = useState({ studentId: '', type: 'Fee Payment', amount: '', method: 'Cash', description: '', date: new Date().toISOString().split('T')[0] });

  const filtered = useMemo(() => {
    let data = txList;
    if (filter !== 'All') data = data.filter((t) => t.type === filter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((t) => (t.studentId || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q) || (t.receiptNo || '').toLowerCase().includes(q));
    }
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [txList, filter, search]);

  const handleAdd = () => {
    const errors = {};
    const amountResult = validateInput(String(form.amount), 'number', { required: true, min: 1, max: 100000000 });
    if (!amountResult.valid) errors.amount = amountResult.error;
    if (form.description) {
      const descResult = validateInput(form.description, 'text', { maxLength: 500 });
      if (!descResult.valid) errors.description = descResult.error;
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    const student = students.find((s) => s.studentId === form.studentId);
    const tx = addTransaction({
      ...form,
      studentId: sanitizeInput(form.studentId),
      studentName: sanitizeInput(student?.studentName || 'N/A'),
      description: sanitizeInput(form.description.trim()),
      amount: parseFloat(form.amount),
    });
    setTxList(getTransactions());
    setAddModal(false);
    setFormErrors({});
    setForm({ studentId: '', type: 'Fee Payment', amount: '', method: 'Cash', description: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    deleteTransaction(id);
    setTxList(getTransactions());
  };

  const totalAmount = filtered.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" text="Loading transactions..." /></div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md text-on-surface">Transaction Log</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Track all financial transactions and payments</p>
        </div>
        <button onClick={() => setAddModal(true)} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-lg">add</span>
          New Transaction
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 sm:px-6 py-3 sm:py-4">
          <p className="text-label-sm sm:text-label-md text-on-surface-variant">Total Transactions</p>
          <p className="text-headline-sm text-on-surface mt-1">{txList.length}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 sm:px-6 py-3 sm:py-4">
          <p className="text-label-sm sm:text-label-md text-on-surface-variant">This Filter</p>
          <p className="text-headline-sm text-on-surface font-mono mt-1">{filtered.length}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 sm:px-6 py-3 sm:py-4">
          <p className="text-label-sm sm:text-label-md text-on-surface-variant">Total Amount</p>
          <p className="text-headline-sm text-emerald-600 font-mono mt-1">PKR {totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 sm:px-6 py-3 sm:py-4">
          <p className="text-label-sm sm:text-label-md text-on-surface-variant">Today</p>
          <p className="text-headline-sm text-on-surface mt-1">{txList.filter((t) => t.date === new Date().toISOString().split('T')[0]).length} txns</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', 'Fee Payment', 'Installment', 'Expense', 'Refund', 'Other'].map((opt) => (
          <button key={opt} onClick={() => setFilter(opt)} className={`px-3 sm:px-4 py-1.5 rounded-full text-label-md whitespace-nowrap transition-all ${filter === opt ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:bg-surface-container-low'}`}>
            {opt}
          </button>
        ))}
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl">
        <div className="px-4 sm:px-6 py-4 border-b border-outline-variant">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-headline-sm text-on-surface">All Transactions</h2>
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input type="search" placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} maxLength={100} className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">receipt_long</span>
            <p className="text-body-md text-on-surface-variant">No transactions recorded yet</p>
            <button onClick={() => setAddModal(true)} className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all">Add First Transaction</button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant">
                    <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider">Receipt</th>
                    <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider">Student</th>
                    <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider hidden lg:table-cell">Method</th>
                    <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider hidden xl:table-cell">Description</th>
                    <th className="px-4 py-3 text-right text-table-header text-on-surface-variant uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-center text-table-header text-on-surface-variant uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filtered.map((tx) => (
                    <tr key={tx.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3 text-label-md text-on-surface-variant font-mono">{tx.receiptNo || tx.id}</td>
                      <td className="px-4 py-3 text-body-md text-on-surface">{tx.date || '-'}</td>
                      <td className="px-4 py-3">
                        <p className="text-body-md text-on-surface font-medium">{tx.studentName || 'N/A'}</p>
                        <p className="text-label-md text-on-surface-variant">{tx.studentId || ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-label-md ${tx.type === 'Fee Payment' ? 'bg-emerald-50 text-emerald-700' : tx.type === 'Expense' ? 'bg-red-50 text-red-700' : tx.type === 'Installment' ? 'bg-blue-50 text-blue-700' : tx.type === 'Refund' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-700'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-body-md text-on-surface hidden lg:table-cell">{tx.method || '-'}</td>
                      <td className="px-4 py-3 text-body-md text-on-surface-variant max-w-[200px] truncate hidden xl:table-cell">{tx.description || '-'}</td>
                      <td className="px-4 py-3 text-body-md font-mono text-right font-semibold text-emerald-600">PKR {(parseFloat(tx.amount) || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleDelete(tx.id)} className="p-1 text-on-surface-variant hover:text-error transition-colors" title="Delete">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-outline-variant">
              {filtered.map((tx) => (
                <div key={tx.id} className="p-4 space-y-2 hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-body-md font-medium text-on-surface">{tx.studentName || 'N/A'}</p>
                      <p className="text-label-md text-on-surface-variant">{tx.studentId || ''} · {tx.date || '-'}</p>
                    </div>
                    <p className="text-body-md font-mono font-semibold text-emerald-600 ml-2 flex-shrink-0">PKR {(parseFloat(tx.amount) || 0).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${tx.type === 'Fee Payment' ? 'bg-emerald-50 text-emerald-700' : tx.type === 'Expense' ? 'bg-red-50 text-red-700' : tx.type === 'Installment' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'}`}>
                        {tx.type}
                      </span>
                      <span className="text-xs text-on-surface-variant">{tx.method || '-'}</span>
                    </div>
                    <button onClick={() => handleDelete(tx.id)} className="p-1 text-on-surface-variant hover:text-error transition-colors" title="Delete">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal open={addModal} onClose={() => { setAddModal(false); setFormErrors({}); }} title="New Transaction">
        <div className="space-y-4">
          {Object.keys(formErrors).length > 0 && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-md">
              {Object.values(formErrors).map((err, i) => <p key={i}>{err}</p>)}
            </div>
          )}
          <div>
            <label className="block text-label-md text-on-surface-variant mb-1.5">Student</label>
            <select value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors">
              <option value="">Select student (optional)</option>
              {students.map((s) => <option key={s.studentId} value={s.studentId}>{s.studentId} - {s.studentName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Transaction Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors">
                <option>Fee Payment</option><option>Installment</option><option>Expense</option><option>Refund</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Amount (PKR)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" min="1" max="100000000" className={`w-full px-4 py-2.5 bg-surface-bright border rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors ${formErrors.amount ? 'border-error' : 'border-outline-variant'}`} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Payment Method</label>
              <select value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors">
                <option>Cash</option><option>Bank Transfer</option><option>JazzCash</option><option>EasyPaisa</option><option>Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-label-md text-on-surface-variant mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Payment for..." rows={3} maxLength={500} className={`w-full px-4 py-2.5 bg-surface-bright border rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors resize-none ${formErrors.description ? 'border-error' : 'border-outline-variant'}`} />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => { setAddModal(false); setFormErrors({}); }} className="px-4 py-2 border border-outline-variant rounded-lg text-label-md hover:bg-surface-container-low transition-colors">Cancel</button>
            <button onClick={handleAdd} disabled={!form.amount || parseFloat(form.amount) <= 0} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 disabled:opacity-50">Add Transaction</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
