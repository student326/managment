import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExcel } from '../hooks/useExcel';
import { validateExcelFile } from '../services/securityService';
import * as XLSX from 'xlsx';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DataSync() {
  const { students, loading, addStudent } = useExcel();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = validateExcelFile(file);
      if (!validation.valid) { alert(validation.error); return; }
      setSelectedFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const validation = validateExcelFile(file);
      if (!validation.valid) { alert(validation.error); return; }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setProcessing(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });

      let imported = 0;
      let skipped = 0;

      for (const row of data) {
        if (!row.studentName && !row['Student Name']) continue;
        const name = row.studentName || row['Student Name'] || '';
        const exists = students.some((s) => (s.studentName || '').toLowerCase() === name.toLowerCase());
        if (exists) { skipped++; continue; }

        try {
          await addStudent({
            studentName: name,
            fatherName: row.fatherName || row['Father Name'] || '',
            phone: row.phone || row['Phone'] || '',
            email: row.email || row['Email'] || '',
            course: row.course || row['Course'] || '',
            batch: row.batch || row['Batch'] || '',
            admissionDate: row.admissionDate || row['Admission Date'] || new Date().toISOString().split('T')[0],
            totalFee: parseFloat(row.totalFee || row['Total Fee']) || 0,
            paid: parseFloat(row.paid || row['Paid']) || 0,
            pending: parseFloat(row.pending || row['Pending']) || 0,
            status: row.status || row['Status'] || 'Unpaid',
            paymentMethod: row.paymentMethod || row['Payment Method'] || '',
            paymentDate: row.paymentDate || row['Payment Date'] || '',
            remarks: row.remarks || row['Remarks'] || '',
          });
          imported++;
        } catch (err) {
          console.warn('Import row failed:', err);
        }
      }

      setSyncResult({ imported, skipped, total: data.length });
      setSelectedFile(null);
    } catch (err) {
      console.error('Import failed:', err);
      alert('Failed to parse Excel file');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" text="Loading..." /></div>;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-body-md text-on-surface-variant mb-2">
        <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/dashboard')}>Management</span>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-primary font-bold">Excel Import</span>
      </div>
      <h1 className="text-headline-md text-on-surface mb-6">Import Excel Data</h1>

      {syncResult ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center space-y-4 animate-fade-in">
          <span className="material-symbols-outlined text-6xl text-emerald-500">check_circle</span>
          <h2 className="text-headline-sm text-on-surface">Import Complete</h2>
          <div className="flex justify-center gap-6">
            <div><p className="text-headline-md text-on-surface">{syncResult.imported}</p><p className="text-label-md text-on-surface-variant">Imported</p></div>
            <div><p className="text-headline-md text-on-surface">{syncResult.skipped}</p><p className="text-label-md text-on-surface-variant">Skipped (duplicates)</p></div>
          </div>
          <button onClick={() => setSyncResult(null)} className="px-6 py-2 bg-primary text-on-primary rounded-lg">Done</button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all ${dragOver ? 'border-primary bg-blue-50/30' : 'border-outline-variant'}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-primary text-3xl">description</span>
              </div>
              <p className="text-headline-sm text-on-surface">{selectedFile.name}</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setSelectedFile(null)} className="px-4 py-2 border border-outline-variant rounded-lg">Remove</button>
                <button onClick={handleUpload} disabled={processing} className="px-4 py-2 bg-primary text-on-primary rounded-lg flex items-center gap-1">
                  {processing ? <LoadingSpinner size="sm" /> : <span className="material-symbols-outlined text-lg">upload_file</span>}
                  Import to Firestore
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
              </div>
              <p className="text-headline-sm text-on-surface">Upload Excel File</p>
              <p className="text-body-md text-on-surface-variant">Import students from .xlsx files. New records will sync instantly to all devices.</p>
              <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2.5 bg-primary text-on-primary rounded-lg">Browse Files</button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />
            </div>
          )}
        </div>
      )}

      {students.length > 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
          <p className="text-body-md text-on-surface-variant">You have <strong className="text-on-surface">{students.length}</strong> student records in Firestore. Data syncs in real-time across all devices.</p>
        </div>
      )}
    </div>
  );
}
