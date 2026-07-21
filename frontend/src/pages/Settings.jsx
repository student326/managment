import { useState } from 'react';
import { useExcel } from '../hooks/useExcel';
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
  const { loading } = useExcel();
  const [activeTab, setActiveTab] = useState('general');
  const [generalSettings, setGeneralSettings] = useState(() => loadSettings());
  const [savedGeneral, setSavedGeneral] = useState(false);

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

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" text="Loading settings..." /></div>;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <h1 className="text-headline-md text-on-surface">Settings</h1>
      <div className="flex items-center gap-2 overflow-x-auto pb-0 border-b border-outline-variant">
        {[
          { value: 'general', label: 'General' },
          { value: 'security', label: 'Security' },
        ].map((opt) => (
          <button key={opt.value} onClick={() => setActiveTab(opt.value)} className={`px-3 sm:px-4 py-2.5 text-label-md whitespace-nowrap transition-all border-b-2 -mb-px ${activeTab === opt.value ? 'border-primary text-primary font-semibold' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>{opt.label}</button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 max-w-2xl">
          <h2 className="text-headline-sm text-on-surface mb-4">General Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Institution Name</label>
              <input value={generalSettings.institutionName} onChange={(e) => setGeneralSettings((s) => ({ ...s, institutionName: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors" />
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Currency</label>
              <input value={generalSettings.currency} readOnly className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-lg text-body-md cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Records per page</label>
              <select value={generalSettings.recordsPerPage} onChange={(e) => setGeneralSettings((s) => ({ ...s, recordsPerPage: e.target.value }))} className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors">
                <option>5</option><option>10</option><option>20</option><option>50</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSaveGeneral} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">save</span>Save Settings
              </button>
              {savedGeneral && <p className="text-emerald-600 text-body-md flex items-center gap-1"><span className="material-symbols-outlined text-lg">check_circle</span>Settings saved</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 max-w-2xl">
          <h2 className="text-headline-sm text-on-surface mb-4">Security Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg"><div><p className="text-body-md font-medium text-on-surface">Firebase Authentication</p><p className="text-label-md text-on-surface-variant">Email/password admin login active</p></div><span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-status-badge">Active</span></div>
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg"><div><p className="text-body-md font-medium text-on-surface">Firestore Real-Time Sync</p><p className="text-label-md text-on-surface-variant">Live data sync across all devices</p></div><span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-status-badge">Active</span></div>
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg"><div><p className="text-body-md font-medium text-on-surface">Input Validation</p><p className="text-label-md text-on-surface-variant">XSS and injection protection</p></div><span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-status-badge">Active</span></div>
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg"><div><p className="text-body-md font-medium text-on-surface">Session Timeout</p><p className="text-label-md text-on-surface-variant">Auto-logout after 30 minutes</p></div><span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-status-badge">Active</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
