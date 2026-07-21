import { ref, uploadBytes, getBytes } from 'firebase/storage';
import { storage } from '../firebase/config';
import * as XLSX from 'xlsx';

const EXCEL_PATH = 'excel/students_fee_record.xlsx';
const LOCAL_CACHE_KEY = 'bursar_excel_cache_v3';

const withTimeout = (promise, ms = 15000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms)),
  ]);
};

const saveLocalCache = (arrayBuffer) => {
  try {
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    localStorage.setItem(LOCAL_CACHE_KEY, btoa(binary));
  } catch (e) {
    console.warn('Failed to cache locally:', e);
  }
};

const loadLocalCache = () => {
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
    const MAX_UPLOAD_RETRIES = 3;
    let lastError = null;
    for (let attempt = 1; attempt <= MAX_UPLOAD_RETRIES; attempt++) {
      try {
        await withTimeout(uploadBytes(storageRef, file), 20000);
        if (rawArrayBuffer) saveLocalCache(rawArrayBuffer);
        console.log('[Storage] Upload succeeded on attempt', attempt);
        return;
      } catch (err) {
        lastError = err;
        console.warn(`[Storage] Upload attempt ${attempt}/${MAX_UPLOAD_RETRIES} failed:`, err.message);
        if (attempt < MAX_UPLOAD_RETRIES) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }
    if (rawArrayBuffer) saveLocalCache(rawArrayBuffer);
    throw new Error(`Upload failed: ${lastError?.message || 'Unknown error'}`);
  })();

  inflightUpload = uploadPromise;
  return uploadPromise;
};

export const downloadExcel = async () => {
  try {
    const storageRef = ref(storage, EXCEL_PATH);
    const bytes = await withTimeout(getBytes(storageRef), 15000);
    saveLocalCache(bytes);
    return bytes;
  } catch (err) {
    console.warn('[Storage] Download failed:', err.message);
    return loadLocalCache();
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
