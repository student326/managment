import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadWorkbook, saveExcelToStorage, getStudentsFromWorkbook, createSampleWorkbook } from '../services/excelService';

const ExcelContext = createContext(null);

const AUTO_REFRESH_INTERVAL = 20000;

export function ExcelProvider({ children }) {
  const [wb, setWb] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const mountedRef = useRef(true);
  const loadedRef = useRef(false);
  const refreshTimerRef = useRef(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent && mountedRef.current) setLoading(true);
    if (silent && mountedRef.current) setSyncing(true);

    try {
      const remoteWb = await loadWorkbook();
      if (remoteWb && mountedRef.current) {
        setWb(remoteWb);
        setStudents(getStudentsFromWorkbook(remoteWb));
        loadedRef.current = true;
        setLastSyncTime(new Date());
        setError(null);
      } else if (mountedRef.current) {
        if (!loadedRef.current) {
          const fallback = createSampleWorkbook();
          setWb(fallback);
          setStudents(getStudentsFromWorkbook(fallback));
          loadedRef.current = true;
          setError('Cloud unavailable. Using local data.');
        }
      }
    } catch (err) {
      console.warn('[ExcelContext] Load failed:', err.message);
      if (!loadedRef.current && mountedRef.current) {
        const fallback = createSampleWorkbook();
        setWb(fallback);
        setStudents(getStudentsFromWorkbook(fallback));
        loadedRef.current = true;
      }
      if (!silent) setError('Could not connect to cloud.');
    } finally {
      if (!silent && mountedRef.current) setLoading(false);
      if (silent && mountedRef.current) setSyncing(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => { mountedRef.current = false; };
  }, [loadData]);

  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      if (mountedRef.current && document.visibilityState === 'visible') {
        loadData(true);
      }
    }, AUTO_REFRESH_INTERVAL);

    const onVisible = () => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        loadData(true);
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(refreshTimerRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadData]);

  const saveWorkbook = useCallback(async (newWb) => {
    setWb(newWb);
    setStudents(getStudentsFromWorkbook(newWb));

    try {
      await saveExcelToStorage(newWb);
      setLastSyncTime(new Date());
      return { success: true };
    } catch (err) {
      console.error('[ExcelContext] Save failed:', err.message);
      setError('Cloud save failed. Data saved locally.');
      throw err;
    }
  }, []);

  const refreshData = useCallback(() => {
    loadedRef.current = false;
    return loadData();
  }, [loadData]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <ExcelContext.Provider value={{ wb, students, loading, error, lastSyncTime, syncing, refreshData, saveWorkbook, clearError }}>
      {children}
    </ExcelContext.Provider>
  );
}

export function useExcel() {
  const ctx = useContext(ExcelContext);
  if (!ctx) throw new Error('useExcel must be used within ExcelProvider');
  return ctx;
}
