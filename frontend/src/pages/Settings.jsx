import { useState, useMemo, useEffect } from 'react';
import { useExcel } from '../hooks/useExcel';
import { addColumnToWorkbook, removeColumnFromWorkbook, renameColumnInWorkbook, getDefaultColumns } from '../services/excelService';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { validateInput, sanitizeInput } from '../services/securityService';

const SETTINGS_KEY = 'bursar_settings';

const loadSettings = () => {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {
      institutionName: 'MarkPro 360',
      currency: 'PKR',
      recordsPerPage: '10',
    };
  } catch {
    return { institutionName: 'MarkPro 360', currency: 'PKR', recordsPerPage: '10' };
  }
};

export default function Settings() {
  const { wb, students, loading, saveWorkbook } = useExcel();
  const [activeTab, setActiveTab] = useState('columns');
  const [renameModal, setRenameModal] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [generalSettings, setGeneralSettings] = useState(() => loadSettings());
  const [savedGeneral, setSavedGeneral] = useState(false);

  const currentColumns = useMemo(() => {
    if (students.length === 0) return getDefaultColumns().map((c) => c.key);
    return Object.keys(students[0]).filter((k) => k !== 'id');
  }, [students]);

  const defaultColKeys = getDefaultColumns().map((c) => c.key);
  const customColumns = currentColumns.filter((k) => !defaultColKeys.includes(k));

  const [columnError, setColumnError] = useState('');

  const handleAddColumn = async () => {
    if (!wb || !newColName.trim()) return;
    const nameResult = validateInput(newColName.trim(), 'name', { required: true, minLength: 1, maxLength: 50 });
    if (!nameResult.valid) {
      setColumnError(nameResult.error);
      return;
    }
    if (defaultColKeys.includes(newColName.trim().toLowerCase().replace(/\s+/g, ''))) {
      setColumnError('This column name already exists');
      return;
    }
    setColumnError('');
    setSaving(true);
    setSaveError('');
    try {
      const newWb = addColumnToWorkbook(wb, sanitizeInput(newColName.trim()));
      await saveWorkbook(newWb);
      setNewColName('');
      setAddModal(false);
    } catch (err) {
      console.error('Add column failed:', err);
      setSaveError('Failed to save column change. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleRenameColumn = async () => {
    if (!wb || !renameValue.trim() || !renameModal) return;
    const nameResult = validateInput(renameValue.trim(), 'name', { required: true, minLength: 1, maxLength: 50 });
    if (!nameResult.valid) return;
    setSaving(true);
    setSaveError('');
    try {
      const newWb = renameColumnInWorkbook(wb, renameModal, sanitizeInput(renameValue.trim()));
      await saveWorkbook(newWb);
      setRenameModal(null);
      setRenameValue('');
    } catch (err) {
      console.error('Rename failed:', err);
      setSaveError('Failed to save column rename. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveColumn = async (colName) => {
    if (!wb || !window.confirm(`Are you sure you want to remove "${colName}"? This will delete all data in this column.`)) return;
    setSaving(true);
    setSaveError('');
    try {
      const newWb = removeColumnFromWorkbook(wb, colName);
      await saveWorkbook(newWb);
    } catch (err) {
      console.error('Remove column failed:', err);
      setSaveError('Failed to remove column. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGeneral = () => {
    const nameResult = validateInput(generalSettings.institutionName, 'name', { required: true, maxLength: 100 });
    if (!nameResult.valid) return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      ...generalSettings,
      institutionName: sanitizeInput(generalSettings.institutionName.trim()),
    }));
    setSavedGeneral(true);
    setTimeout(() => setSavedGeneral(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <h1 className="text-headline-md text-on-surface">Settings</h1>

      <div className="flex items-center gap-2 overflow-x-auto pb-0 border-b border-outline-variant">
        {[
          { value: 'columns', label: 'Column Management' },
          { value: 'general', label: 'General' },
          { value: 'security', label: 'Security' },
        ].map((opt) => (
          <button key={opt.value} onClick={() => setActiveTab(opt.value)} className={`px-3 sm:px-4 py-2.5 text-label-md whitespace-nowrap transition-all border-b-2 -mb-px ${
            activeTab === opt.value ? 'border-primary text-primary font-semibold' : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}>
            {opt.label}
          </button>
        ))}
      </div>

      {activeTab === 'columns' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-headline-sm text-on-surface">Column Management</h2>
              <p className="text-body-md text-on-surface-variant mt-1">Add, rename, or remove columns from the Excel structure</p>
            </div>
            <button onClick={() => setAddModal(true)} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">add</span>
              Add Column
            </button>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="divide-y divide-outline-variant">
              {currentColumns.map((col) => {
                const isDefault = defaultColKeys.includes(col);
                const displayLabel = getDefaultColumns().find((c) => c.key === col)?.label || col;
                return (
                  <div key={col} className="px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDefault ? 'bg-primary-fixed' : 'bg-amber-50'}`}>
                        <span className={`material-symbols-outlined text-lg ${isDefault ? 'text-primary' : 'text-amber-600'}`}>view_column</span>
                      </span>
                      <div>
                        <p className="text-body-md font-medium text-on-surface">{displayLabel}</p>
                        <p className="text-label-md text-on-surface-variant">Key: {col} {isDefault ? '(Default)' : '(Custom)'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setRenameModal(col); setRenameValue(col); }} className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container-high transition-colors" title="Rename">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      {!isDefault && (
                        <button onClick={() => handleRemoveColumn(col)} className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-surface-container-high transition-colors" title="Remove">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'general' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 max-w-2xl">
          <h2 className="text-headline-sm text-on-surface mb-4">General Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Institution Name</label>
              <input
                value={generalSettings.institutionName}
                onChange={(e) => setGeneralSettings((s) => ({ ...s, institutionName: e.target.value }))}
                className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors"
              />
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Currency</label>
              <input value={generalSettings.currency} readOnly className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-lg text-body-md cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Records per page</label>
              <select
                value={generalSettings.recordsPerPage}
                onChange={(e) => setGeneralSettings((s) => ({ ...s, recordsPerPage: e.target.value }))}
                className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors"
              >
                <option>5</option><option>10</option><option>20</option><option>50</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSaveGeneral} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">save</span>
                Save Settings
              </button>
              {savedGeneral && (
                <p className="text-emerald-600 text-body-md flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Settings saved
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 max-w-2xl">
          <h2 className="text-headline-sm text-on-surface mb-4">Security Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
              <div>
                <p className="text-body-md font-medium text-on-surface">Firebase Authentication</p>
                <p className="text-label-md text-on-surface-variant">Email/password admin login active</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-status-badge">Active</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
              <div>
                <p className="text-body-md font-medium text-on-surface">Firebase Storage Rules</p>
                <p className="text-label-md text-on-surface-variant">Authenticated-only, file size limit 10MB, Excel types only</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-status-badge">Secure</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
              <div>
                <p className="text-body-md font-medium text-on-surface">Input Validation</p>
                <p className="text-label-md text-on-surface-variant">XSS, SQL injection, and command injection protection</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-status-badge">Active</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
              <div>
                <p className="text-body-md font-medium text-on-surface">Login Rate Limiting</p>
                <p className="text-label-md text-on-surface-variant">5 attempts per 15-minute window</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-status-badge">Active</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
              <div>
                <p className="text-body-md font-medium text-on-surface">Session Timeout</p>
                <p className="text-label-md text-on-surface-variant">Auto-logout after 30 minutes of inactivity</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-status-badge">Active</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
              <div>
                <p className="text-body-md font-medium text-on-surface">Security Headers</p>
                <p className="text-label-md text-on-surface-variant">CSP, HSTS, X-Frame-Options, X-Content-Type-Options</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-status-badge">Active</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
              <div>
                <p className="text-body-md font-medium text-on-surface">Password Hashing</p>
                <p className="text-label-md text-on-surface-variant">Firebase Authentication with bcrypt/scrypt hashing</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-status-badge">Secure</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
              <div>
                <p className="text-body-md font-medium text-on-surface">Security Logging</p>
                <p className="text-label-md text-on-surface-variant">Auth attempts, errors, and suspicious activity tracked</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-status-badge">Active</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
              <div>
                <p className="text-body-md font-medium text-on-surface">Data Storage</p>
                <p className="text-label-md text-on-surface-variant">Excel-only, no Firestore database used</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-status-badge">Private</span>
            </div>
          </div>
        </div>
      )}

      <Modal open={addModal} onClose={() => { setAddModal(false); setColumnError(''); }} title="Add New Column">
        <div className="space-y-4">
          <div>
            <label className="block text-label-md text-on-surface-variant mb-1.5">Column Name</label>
            <input
              value={newColName}
              onChange={(e) => { setNewColName(e.target.value); setColumnError(''); }}
              placeholder="e.g., Address, Discount, Remarks"
              maxLength={50}
              className={`w-full px-4 py-2.5 bg-surface-bright border rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors ${columnError ? 'border-error' : 'border-outline-variant'}`}
              onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
            />
            {columnError && <p className="text-error text-label-md mt-1">{columnError}</p>}
          </div>
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setAddModal(false)} className="px-4 py-2 border border-outline-variant rounded-lg text-label-md hover:bg-surface-container-low transition-colors">Cancel</button>
            <button onClick={handleAddColumn} disabled={saving || !newColName.trim()} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 disabled:opacity-50">
              {saving ? <LoadingSpinner size="sm" /> : 'Add Column'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!renameModal} onClose={() => setRenameModal(null)} title="Rename Column">
        <div className="space-y-4">
          <div>
            <label className="block text-label-md text-on-surface-variant mb-1.5">New Name</label>
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleRenameColumn()}
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setRenameModal(null)} className="px-4 py-2 border border-outline-variant rounded-lg text-label-md hover:bg-surface-container-low transition-colors">Cancel</button>
            <button onClick={handleRenameColumn} disabled={saving || !renameValue.trim()} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 disabled:opacity-50">
              {saving ? <LoadingSpinner size="sm" /> : 'Rename'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
