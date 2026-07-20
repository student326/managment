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
        await saveExcelToStorage(workbook);
      }
      setWb(workbook);
      setStudents(getStudentsFromWorkbook(workbook));
    } catch (err) {
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { wb, students, loading, error, refreshData, saveWorkbook };
}
