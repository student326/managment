import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadWorkbook, saveExcelToStorage, getStudentsFromWorkbook, createSampleWorkbook } from '../services/excelService';

const ExcelContext = createContext(null);

const AUTO_REFRESH_INTERVAL = 15000;

export function ExcelProvider({ children }) {
  const [wb, setWb] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const mountedRef = useRef(true);
  const loadedRef = useRef(false);
  const wbRef = useRef(null);
  const refreshTimerRef = useRef(null);

  const loadRemoteData = useCallback(async (silent = false) => {
    if (!silent && mountedRef.current) setLoading(true);
    if (silent) setSyncing(true);
    setError(null);

    try {
      const remoteWb = await loadWorkbook();
      if (remoteWb && mountedRef.current) {
        setWb(remoteWb);
        wbRef.current = remoteWb;
        setStudents(getStudentsFromWorkbook(remoteWb));
        loadedRef.current = true;
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.warn('[ExcelContext] Remote load failed:', err.message);
      if (!silent) setError('Failed to load data from cloud. Showing cached data.');
    } finally {
      if (!silent && mountedRef.current) setLoading(false);
      if (silent) setSyncing(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadRemoteData();
    return () => { mountedRef.current = false; };
  }, [loadRemoteData]);

  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      if (mountedRef.current && document.visibilityState === 'visible') {
        loadRemoteData(true);
      }
    }, AUTO_REFRESH_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        loadRemoteData(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(refreshTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadRemoteData]);

  const saveWorkbook = useCallback(async (newWb) => {
    setWb(newWb);
    wbRef.current = newWb;
    setStudents(getStudentsFromWorkbook(newWb));

    try {
      await saveExcelToStorage(newWb);
      setLastSyncTime(new Date());
      return { success: true };
    } catch (err) {
      console.error('[ExcelContext] Save failed:', err.message);
      setError('Failed to save to cloud. Data saved locally only. ' + err.message);
      await loadRemoteData(true);
      throw err;
    }
  }, [loadRemoteData]);

  const refreshData = useCallback(() => {
    loadedRef.current = false;
    return loadRemoteData();
  }, [loadRemoteData]);

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
