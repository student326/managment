import { useState, useEffect, useCallback, useRef } from 'react';
import { loadWorkbook, saveExcelToStorage, getStudentsFromWorkbook, createSampleWorkbook } from '../services/excelService';

export function useExcel() {
  const [wb, setWb] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const loadDataRef = useRef(null);

  const loadData = useCallback(async () => {
    if (mountedRef.current) setLoading(true);
    setError(null);

    try {
      const remoteWb = await loadWorkbook();
      if (remoteWb && mountedRef.current) {
        setWb(remoteWb);
        setStudents(getStudentsFromWorkbook(remoteWb));
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('[useExcel] Remote load failed:', err.message);
    }

    const fallback = createSampleWorkbook();
    if (mountedRef.current) {
      setWb(fallback);
      setStudents(getStudentsFromWorkbook(fallback));
      setLoading(false);
    }
  }, []);

  loadDataRef.current = loadData;

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => { mountedRef.current = false; };
  }, [loadData]);

  const saveWorkbook = useCallback(async (newWb) => {
    setWb(newWb);
    setStudents(getStudentsFromWorkbook(newWb));

    try {
      await saveExcelToStorage(newWb);
    } catch (err) {
      console.warn('[useExcel] Save to storage failed:', err.message);
    }
  }, []);

  const refreshData = useCallback(() => {
    if (loadDataRef.current) {
      return loadDataRef.current();
    }
  }, []);

  return { wb, students, loading, error, refreshData, saveWorkbook };
}
