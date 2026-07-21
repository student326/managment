import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadWorkbook, saveExcelToStorage, getStudentsFromWorkbook, createSampleWorkbook } from '../services/excelService';

const ExcelContext = createContext(null);

export function ExcelProvider({ children }) {
  const [wb, setWb] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const loadedRef = useRef(false);

  const loadRemoteData = useCallback(async () => {
    if (mountedRef.current) setLoading(true);
    setError(null);

    try {
      const remoteWb = await loadWorkbook();
      if (remoteWb && mountedRef.current) {
        setWb(remoteWb);
        setStudents(getStudentsFromWorkbook(remoteWb));
        loadedRef.current = true;
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('[ExcelContext] Remote load failed:', err.message);
    }

    if (!loadedRef.current) {
      const fallback = createSampleWorkbook();
      if (mountedRef.current) {
        setWb(fallback);
        setStudents(getStudentsFromWorkbook(fallback));
        setLoading(false);
      }
    } else {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadRemoteData();
    return () => { mountedRef.current = false; };
  }, [loadRemoteData]);

  const saveWorkbook = useCallback(async (newWb) => {
    setWb(newWb);
    setStudents(getStudentsFromWorkbook(newWb));

    try {
      await saveExcelToStorage(newWb);
    } catch (err) {
      console.warn('[ExcelContext] Save failed:', err.message);
    }
  }, []);

  const refreshData = useCallback(() => {
    loadedRef.current = false;
    return loadRemoteData();
  }, [loadRemoteData]);

  return (
    <ExcelContext.Provider value={{ wb, students, loading, error, refreshData, saveWorkbook }}>
      {children}
    </ExcelContext.Provider>
  );
}

export function useExcel() {
  const ctx = useContext(ExcelContext);
  if (!ctx) throw new Error('useExcel must be used within ExcelProvider');
  return ctx;
}
