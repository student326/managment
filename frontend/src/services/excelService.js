import * as XLSX from 'xlsx';
import { uploadExcel, downloadExcel } from './storageService';

const DEFAULT_COLUMNS = [
  { key: 'studentId', label: 'ID' },
  { key: 'studentName', label: 'Student Name' },
  { key: 'fatherName', label: 'Father Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'course', label: 'Course' },
  { key: 'batch', label: 'Batch' },
  { key: 'admissionDate', label: 'Admission Date' },
  { key: 'totalFee', label: 'Total Fee' },
  { key: 'paid', label: 'Paid' },
  { key: 'pending', label: 'Pending' },
  { key: 'status', label: 'Status' },
  { key: 'paymentMethod', label: 'Payment Method' },
  { key: 'paymentDate', label: 'Payment Date' },
  { key: 'remarks', label: 'Remarks' },
];

export const getDefaultColumns = () => [...DEFAULT_COLUMNS];

export const createSampleWorkbook = () => {
  const wb = XLSX.utils.book_new();
  const sampleData = [
    {
      studentId: 'STD-001',
      studentName: 'James Anderson',
      fatherName: 'Robert Anderson',
      phone: '0300-1234567',
      email: 'james@example.com',
      course: 'FSc Pre-Medical',
      batch: '2024-2025',
      admissionDate: '2024-01-15',
      totalFee: 12000,
      paid: 12000,
      pending: 0,
      status: 'Paid',
      paymentMethod: 'Bank Transfer',
      paymentDate: '2024-01-20',
      remarks: '',
    },
    {
      studentId: 'STD-002',
      studentName: 'Elena Cooper',
      fatherName: 'Michael Cooper',
      phone: '0301-7654321',
      email: 'elena@example.com',
      course: 'ICS Part 1',
      batch: '2024-2025',
      admissionDate: '2024-02-01',
      totalFee: 8500,
      paid: 4250,
      pending: 4250,
      status: 'Partial',
      paymentMethod: 'Cash',
      paymentDate: '2024-02-05',
      remarks: 'Remaining due by March',
    },
    {
      studentId: 'STD-003',
      studentName: 'Marcus Lee',
      fatherName: 'David Lee',
      phone: '0302-9876543',
      email: 'marcus@example.com',
      course: 'Grade 10',
      batch: '2024-2025',
      admissionDate: '2024-01-10',
      totalFee: 9200,
      paid: 0,
      pending: 9200,
      status: 'Unpaid',
      paymentMethod: '',
      paymentDate: '',
      remarks: 'Pending clearance',
    },
    {
      studentId: 'STD-004',
      studentName: 'Sophia Kim',
      fatherName: 'John Kim',
      phone: '0303-4567890',
      email: 'sophia@example.com',
      course: 'FSc Pre-Medical',
      batch: '2024-2025',
      admissionDate: '2024-01-20',
      totalFee: 10500,
      paid: 10500,
      pending: 0,
      status: 'Paid',
      paymentMethod: 'Scholarship',
      paymentDate: '2024-01-25',
      remarks: 'Merit scholarship holder',
    },
    {
      studentId: 'STD-005',
      studentName: 'Thomas Reed',
      fatherName: 'William Reed',
      phone: '0304-5678901',
      email: 'thomas@example.com',
      course: 'Grade 9',
      batch: '2024-2025',
      admissionDate: '2024-02-10',
      totalFee: 15000,
      paid: 7500,
      pending: 7500,
      status: 'Partial',
      paymentMethod: 'JazzCash',
      paymentDate: '2024-02-15',
      remarks: 'Second installment due',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(sampleData);
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  return wb;
};

export const saveExcelToStorage = async (wb) => {
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const file = new File([blob], 'students_fee_record.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  await uploadExcel(file);
  return file;
};

export const loadWorkbook = async () => {
  try {
    const bytes = await downloadExcel();
    if (!bytes) return null;
    const wb = XLSX.read(bytes, { type: 'array' });
    return wb;
  } catch (err) {
    console.error('loadWorkbook error:', err);
    return null;
  }
};

export const getStudentsFromWorkbook = (wb) => {
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
  return data.map((row, idx) => ({ ...row, id: row.studentId || `row-${idx}` }));
};

export const updateStudentInWorkbook = (wb, studentId, updatedData) => {
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const idx = data.findIndex((r) => r.studentId === studentId || r.id === studentId);
  if (idx === -1) return false;
  data[idx] = { ...data[idx], ...updatedData };
  if (data[idx].totalFee && data[idx].paid !== undefined) {
    data[idx].pending = data[idx].totalFee - data[idx].paid;
    if (data[idx].pending <= 0) {
      data[idx].pending = 0;
      data[idx].status = 'Paid';
    } else if (data[idx].paid > 0) {
      data[idx].status = 'Partial';
    } else {
      data[idx].status = 'Unpaid';
    }
  }
  const newWs = XLSX.utils.json_to_sheet(data);
  wb.Sheets[sheetName] = newWs;
  return true;
};

export const addStudentToWorkbook = (wb, studentData) => {
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const maxId = data.reduce((max, r) => {
    const num = parseInt(String(r.studentId || '0').replace('STD-', ''));
    return num > max ? num : max;
  }, 0);
  const newStudent = {
    studentId: `STD-${String(maxId + 1).padStart(3, '0')}`,
    ...studentData,
  };
  if (newStudent.totalFee && newStudent.paid !== undefined) {
    newStudent.pending = newStudent.totalFee - newStudent.paid;
    if (newStudent.pending <= 0) {
      newStudent.pending = 0;
      newStudent.status = 'Paid';
    } else if (newStudent.paid > 0) {
      newStudent.status = 'Partial';
    } else {
      newStudent.status = 'Unpaid';
    }
  }
  data.push(newStudent);
  const newWs = XLSX.utils.json_to_sheet(data);
  wb.Sheets[sheetName] = newWs;
  return newStudent;
};

export const deleteStudentFromWorkbook = (wb, studentId) => {
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const filtered = data.filter((r) => r.studentId !== studentId && r.id !== studentId);
  if (filtered.length === data.length) return false;
  const newWs = XLSX.utils.json_to_sheet(filtered);
  wb.Sheets[sheetName] = newWs;
  return true;
};

export const addColumnToWorkbook = (wb, columnName, defaultValue = '') => {
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const updated = data.map((row) => ({ ...row, [columnName]: row[columnName] ?? defaultValue }));
  const newWs = XLSX.utils.json_to_sheet(updated);
  wb.Sheets[sheetName] = newWs;
  return true;
};

export const removeColumnFromWorkbook = (wb, columnName) => {
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const updated = data.map((row) => {
    const { [columnName]: _, ...rest } = row;
    return rest;
  });
  const newWs = XLSX.utils.json_to_sheet(updated);
  wb.Sheets[sheetName] = newWs;
  return true;
};

export const renameColumnInWorkbook = (wb, oldName, newName) => {
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const updated = data.map((row) => {
    const { [oldName]: value, ...rest } = row;
    return { ...rest, [newName]: value };
  });
  const newWs = XLSX.utils.json_to_sheet(updated);
  wb.Sheets[sheetName] = newWs;
  return true;
};

export const exportWorkbook = (wb) => {
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'students_fee_record.xlsx';
  a.click();
  URL.revokeObjectURL(url);
};
