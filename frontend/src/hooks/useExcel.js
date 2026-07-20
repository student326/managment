import { useState, useEffect, useCallback, useRef } from 'react';
import { loadWorkbook, saveExcelToStorage, getStudentsFromWorkbook, createSampleWorkbook } from '../services/excelService';

export function useExcel() {
  const [wb, setWb] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const loadData = useCallback(async () => {
    if (mountedRef.current) setLoading(true);
    setError(null);

    try {
      const workbook = createSampleWorkbook();
      const localStudents = getStudentsFromWorkbook(workbook);

      if (mountedRef.current) {
        setWb(workbook);
        setStudents(localStudents);
        setLoading(false);
      }

      try {
        const remoteWb = await loadWorkbook();
        if (remoteWb && mountedRef.current) {
          setWb(remoteWb);
          setStudents(getStudentsFromWorkbook(remoteWb));
        }
      } catch {
        saveExcelToStorage(workbook).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      if (mountedRef.current) {
        const fallback = createSampleWorkbook();
        setWb(fallback);
        setStudents(getStudentsFromWorkbook(fallback));
        setError(err.message);
        setLoading(false);
      }
    }
  }, []);

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
      console.warn('Save to storage failed, data kept locally:', err.message);
    }
  }, []);

  return { wb, students, loading, error, refreshData: loadData, saveWorkbook };
}
