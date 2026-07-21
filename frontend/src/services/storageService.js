import { ref, uploadBytes, getBytes } from 'firebase/storage';
import { storage } from '../firebase/config';
import * as XLSX from 'xlsx';

const EXCEL_PATH = 'excel/students_fee_record.xlsx';
const LOCAL_CACHE_KEY = 'bursar_excel_cache_v3';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const withTimeout = (promise, ms = 45000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms)),
  ]);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    try {
      await inflightUpload;
    } catch {}
    inflightUpload = null;
  }

  const uploadPromise = (async () => {
    let lastError = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await withTimeout(uploadBytes(storageRef, file), 45000);
        if (rawArrayBuffer) saveLocalCache(rawArrayBuffer);
        console.log('[Storage] Upload succeeded on attempt', attempt);
        return;
      } catch (err) {
        lastError = err;
        console.warn(`[Storage] Upload attempt ${attempt}/${MAX_RETRIES} failed:`, err.message);
        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAY_MS * attempt);
        }
      }
    }
    if (rawArrayBuffer) saveLocalCache(rawArrayBuffer);
    throw new Error(`Upload failed after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`);
  })();

  inflightUpload = uploadPromise;
  return uploadPromise;
};

export const downloadExcel = async () => {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const storageRef = ref(storage, EXCEL_PATH);
      const bytes = await withTimeout(getBytes(storageRef), 45000);
      saveLocalCache(bytes);
      return bytes;
    } catch (err) {
      lastError = err;
      console.warn(`[Storage] Download attempt ${attempt}/${MAX_RETRIES} failed:`, err.message);
      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS * attempt);
      }
    }
  }
  console.warn('[Storage] All download attempts failed, trying local cache');
  return loadLocalCache();
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
