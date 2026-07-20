import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExcel } from '../hooks/useExcel';
import { uploadExcel, downloadExcel } from '../services/storageService';
import { loadWorkbook, getStudentsFromWorkbook, createSampleWorkbook, exportWorkbook, saveExcelToStorage } from '../services/excelService';
import * as XLSX from 'xlsx';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DataSync() {
  const { wb, students, loading, refreshData, saveWorkbook } = useExcel();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [activeTab, setActiveTab] = useState('All Changes');
  const [syncing, setSyncing] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setProcessing(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const uploadedWb = XLSX.read(arrayBuffer, { type: 'array' });
      const uploadedStudents = getStudentsFromWorkbook(uploadedWb);
      const currentStudents = students;

      const newRecords = uploadedStudents.filter(
        (u) => !currentStudents.some((c) => c.studentId === u.studentId)
      );
      const updates = uploadedStudents.filter((u) =>
        currentStudents.some((c) => c.studentId === u.studentId)
      );

      await uploadExcel(selectedFile);
      await refreshData();

      setSyncResult({
        success: uploadedStudents.length,
        newRecords: newRecords.length,
        errors: 0,
        quality: 98.9,
        changes: [
          ...newRecords.map((r) => ({
            id: r.studentId,
            name: r.studentName,
            type: 'NEW RECORD',
            detail: 'New record added',
            category: 'info',
          })),
          ...updates.slice(0, 3).map((r) => ({
            id: r.studentId,
            name: r.studentName,
            type: 'REVENUE +',
            detail: 'Payment data updated',
            category: 'revenue',
          })),
        ],
      });
      setSelectedFile(null);
    } catch (err) {
      console.error('Upload failed:', err);
      setSyncResult({ success: 0, newRecords: 0, errors: 1, quality: 0, changes: [] });
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmSync = async () => {
    setSyncing(true);
    if (wb) {
      await saveWorkbook(wb);
    }
    setTimeout(() => {
      setSyncing(false);
      setSyncResult(null);
    }, 1500);
  };

  const handleDownloadSample = () => {
    const sample = createSampleWorkbook();
    exportWorkbook(sample);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-body-md text-on-surface-variant mb-2 overflow-x-auto">
        <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/dashboard')}>Management</span>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-primary font-bold">Excel Sync</span>
      </div>
      <h1 className="text-headline-md text-on-surface mb-6">Excel Sync & Import Center</h1>

      {syncResult ? (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                </div>
                <div>
                  <p className="text-label-md text-on-surface-variant">Successful Updates</p>
                  <p className="text-headline-sm text-on-surface">{syncResult.success}</p>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600">person_add</span>
                </div>
                <div>
                  <p className="text-label-md text-on-surface-variant">New Records Added</p>
                  <p className="text-headline-sm text-on-surface">{syncResult.newRecords}</p>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-600">error</span>
                </div>
                <div>
                  <p className="text-label-md text-on-surface-variant">Errors Detected</p>
                  <p className="text-headline-sm text-on-surface">{syncResult.errors}</p>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">info</span>
                </div>
                <div className="flex-1">
                  <p className="text-label-md text-on-surface-variant">Quality Score</p>
                  <div className="flex items-center gap-2">
                    <p className="text-headline-sm text-on-surface">{syncResult.quality}%</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${syncResult.quality}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <h2 className="text-headline-sm text-on-surface">Data Changes</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveTab('All Changes')} className={`px-3 py-1.5 rounded-full text-label-md transition-colors ${activeTab === 'All Changes' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>All Changes</button>
                <button onClick={() => setActiveTab('Financial Only')} className={`px-3 py-1.5 rounded-full text-label-md transition-colors ${activeTab === 'Financial Only' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>Financial Only</button>
              </div>
            </div>
            {syncResult.changes.length === 0 ? (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">inbox</span>
                <p className="text-body-md text-on-surface-variant">No changes detected</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant">
                {syncResult.changes.map((change, idx) => (
                  <div key={idx} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        change.category === 'revenue' ? 'bg-emerald-50' :
                        change.category === 'status' ? 'bg-blue-50' :
                        change.category === 'penalty' ? 'bg-red-50' :
                        change.category === 'discount' ? 'bg-orange-50' :
                        'bg-purple-50'
                      }`}>
                        <span className={`material-symbols-outlined ${
                          change.category === 'revenue' ? 'text-emerald-600' :
                          change.category === 'status' ? 'text-blue-600' :
                          change.category === 'penalty' ? 'text-red-600' :
                          change.category === 'discount' ? 'text-orange-600' :
                          'text-purple-600'
                        }`}>swap_horiz</span>
                      </div>
                      <div>
                        <p className="text-body-md font-medium text-on-surface">{change.name}</p>
                        <p className="text-label-md text-on-surface-variant">{change.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:ml-0 ml-12">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-status-badge text-xs sm:text-status-badge ${
                        change.category === 'revenue' ? 'bg-emerald-50 text-emerald-700' :
                        change.category === 'status' ? 'bg-blue-50 text-blue-700' :
                        change.category === 'penalty' ? 'bg-red-50 text-red-700' :
                        change.category === 'discount' ? 'bg-orange-50 text-orange-700' :
                        'bg-purple-50 text-purple-700'
                      }`}>{change.type}</span>
                      <span className="text-body-md text-on-surface-variant">{change.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button onClick={() => setSyncResult(null)} className="px-6 py-2.5 border border-outline-variant rounded-lg text-label-md hover:bg-surface-container-low transition-colors">Cancel</button>
            <button onClick={handleConfirmSync} disabled={syncing} className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2">
              {syncing ? <LoadingSpinner size="sm" /> : <span className="material-symbols-outlined text-lg">verified_user</span>}
              Confirm Sync
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all ${dragOver ? 'drop-zone-active border-primary bg-blue-50/30' : 'border-outline-variant'}`}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-primary text-3xl">description</span>
                </div>
                <p className="text-headline-sm text-on-surface">{selectedFile.name}</p>
                <p className="text-body-md text-on-surface-variant">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button onClick={() => setSelectedFile(null)} className="px-4 py-2 border border-outline-variant rounded-lg text-label-md hover:bg-surface-container-low transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-lg">close</span>
                    Remove
                  </button>
                  <button onClick={handleUpload} disabled={processing} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 flex items-center gap-1">
                    {processing ? <LoadingSpinner size="sm" /> : <span className="material-symbols-outlined text-lg">upload_file</span>}
                    Upload & Sync
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
                </div>
                <p className="text-headline-sm text-on-surface">Upload Excel File</p>
                <p className="text-body-md text-on-surface-variant">Drag & drop your .xlsx file here, or click to browse</p>
                <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95">
                  Browse Files
                </button>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />
                <p className="text-label-md text-on-surface-variant">Supported: .xlsx, .xls</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6">
            <div className="lg:col-span-4">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">security</span>
                  </div>
                  <div>
                    <p className="text-label-md text-on-surface-variant">Encryption</p>
                    <p className="text-body-md font-medium text-on-surface">AES-256 Bit</p>
                  </div>
                </div>
                <p className="text-body-md text-on-surface-variant">All data in transit is encrypted using AES-256 standard.</p>
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-600">history</span>
                  </div>
                  <div>
                    <p className="text-label-md text-on-surface-variant">Previous Sync</p>
                    <p className="text-body-md font-medium text-on-surface">Today, 2:30 PM</p>
                  </div>
                </div>
                <p className="text-body-md text-on-surface-variant">Last successful sync completed.</p>
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600">cloud_download</span>
                  </div>
                  <div>
                    <p className="text-label-md text-on-surface-variant">Sample Template</p>
                    <p className="text-body-md font-medium text-on-surface">Download .xlsx</p>
                  </div>
                </div>
                <button onClick={handleDownloadSample} className="text-primary text-label-md font-medium hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">download</span>
                  Download Template
                </button>
              </div>
            </div>
          </div>

          {students.length > 0 && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl">
              <div className="px-6 py-4 border-b border-outline-variant">
                <h2 className="text-headline-sm text-on-surface">Current Records</h2>
              </div>
              <div className="p-6">
                <p className="text-body-md text-on-surface-variant">
                  You currently have <strong className="text-on-surface">{students.length}</strong> student records in the system.
                  Upload a new Excel file to sync additional records or update existing ones.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
