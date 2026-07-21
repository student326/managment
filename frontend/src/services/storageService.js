import { ref, uploadBytes, getBytes } from 'firebase/storage';
import { storage } from '../firebase/config';
import * as XLSX from 'xlsx';

const EXCEL_PATH = 'excel/students_fee_record.xlsx';
const LOCAL_CACHE_KEY = 'bursar_excel_cache_v3';

const saveLocalCache = (arrayBuffer) => {
  try {
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    localStorage.setItem(LOCAL_CACHE_KEY, btoa(binary));
  } catch (e) {
    console.warn('Cache save failed:', e);
  }
};

export const loadLocalCache = () => {
  try {
    const cached = localStorage.getItem(LOCAL_CACHE_KEY);
    if (!cached) return null;
    const binary = atob(cached);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } catch {
    return null;
  }
};

let inflightUpload = null;

export const uploadExcel = async (file, rawArrayBuffer) => {
  const storageRef = ref(storage, EXCEL_PATH);

  if (inflightUpload) {
    try { await inflightUpload; } catch {}
    inflightUpload = null;
  }

  const uploadPromise = (async () => {
    try {
      await Promise.race([
        uploadBytes(storageRef, file),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Upload timeout')), 15000)),
      ]);
      if (rawArrayBuffer) saveLocalCache(rawArrayBuffer);
      console.log('[Storage] Upload OK');
    } catch (err) {
      console.warn('[Storage] Upload failed, saved locally:', err.message);
      if (rawArrayBuffer) saveLocalCache(rawArrayBuffer);
    }
  })();

  inflightUpload = uploadPromise;
  return uploadPromise;
};

export const downloadExcel = async () => {
  const localBytes = loadLocalCache();
  if (localBytes) {
    console.log('[Storage] Loaded from local cache');
    fetchFromCloud();
    return localBytes;
  }

  try {
    const storageRef = ref(storage, EXCEL_PATH);
    const bytes = await Promise.race([
      getBytes(storageRef),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 6000)),
    ]);
    saveLocalCache(bytes);
    return bytes;
  } catch (err) {
    console.warn('[Storage] Cloud download failed:', err.message);
    return null;
  }
};

const fetchFromCloud = async () => {
  try {
    const storageRef = ref(storage, EXCEL_PATH);
    const bytes = await Promise.race([
      getBytes(storageRef),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000)),
    ]);
    saveLocalCache(bytes);
    console.log('[Storage] Cloud sync OK');
    window.dispatchEvent(new CustomEvent('storage-synced'));
  } catch (err) {
    console.warn('[Storage] Background sync failed:', err.message);
  }
};

export const hasLocalCache = () => {
  return !!localStorage.getItem(LOCAL_CACHE_KEY);
};

export const deleteExcel = async () => {
  try {
    const storageRef = ref(storage, EXCEL_PATH);
    const { deleteObject } = await import('firebase/storage');
    await deleteObject(storageRef);
  } catch {}
  localStorage.removeItem(LOCAL_CACHE_KEY);
};
