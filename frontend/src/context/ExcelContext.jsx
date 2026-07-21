import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  subscribeToStudents,
  addStudent as svcAddStudent,
  updateStudent as svcUpdateStudent,
  deleteStudent as svcDeleteStudent,
  getNextStudentId,
} from '../services/studentService';

const ExcelContext = createContext(null);

export function ExcelProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);

    const unsub = subscribeToStudents((data, err) => {
      if (!mountedRef.current) return;
      if (err) {
        setError('Real-time sync failed: ' + err.message);
        setLoading(false);
        return;
      }
      setStudents(data);
      setLastSyncTime(new Date());
      setLoading(false);
      setError(null);
    });

    return () => {
      mountedRef.current = false;
      if (unsub) unsub();
    };
  }, []);

  const addStudent = useCallback(async (studentData) => {
    const studentId = await getNextStudentId();
    await svcAddStudent({ ...studentData, student_id: studentId });
    return studentId;
  }, []);

  const updateStudent = useCallback(async (studentId, studentData) => {
    await svcUpdateStudent(studentId, studentData);
  }, []);

  const deleteStudent = useCallback(async (studentId) => {
    await svcDeleteStudent(studentId);
  }, []);

  const refreshData = useCallback(() => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1000);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <ExcelContext.Provider value={{
      students,
      loading,
      error,
      lastSyncTime,
      syncing,
      addStudent,
      updateStudent,
      deleteStudent,
      refreshData,
      clearError,
    }}>
      {children}
    </ExcelContext.Provider>
  );
}

export function useExcel() {
  const ctx = useContext(ExcelContext);
  if (!ctx) throw new Error('useExcel must be used within ExcelProvider');
  return ctx;
}
