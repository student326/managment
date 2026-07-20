import { useState, useEffect, useCallback } from 'react';
import { loadWorkbook, saveExcelToStorage, getStudentsFromWorkbook, createSampleWorkbook } from '../services/excelService';

export function useExcel() {
  const [wb, setWb] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let workbook = await loadWorkbook();
      if (!workbook) {
        workbook = createSampleWorkbook();
        saveExcelToStorage(workbook).catch(() => {});
      }
      setWb(workbook);
      setStudents(getStudentsFromWorkbook(workbook));
    } catch (err) {
      console.error('Failed to load workbook:', err);
      const fallback = createSampleWorkbook();
      setWb(fallback);
      setStudents(getStudentsFromWorkbook(fallback));
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const saveWorkbook = useCallback(async (newWb) => {
    setLoading(true);
    try {
      await saveExcelToStorage(newWb);
      setWb(newWb);
      setStudents(getStudentsFromWorkbook(newWb));
    } catch (err) {
      console.error('Failed to save workbook:', err);
      setWb(newWb);
      setStudents(getStudentsFromWorkbook(newWb));
    } finally {
      setLoading(false);
    }
  }, []);

  return { wb, students, loading, error, refreshData, saveWorkbook };
}
