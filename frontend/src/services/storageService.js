import { ref, uploadBytes, getBytes } from 'firebase/storage';
import { storage } from '../firebase/config';

const EXCEL_PATH = 'excel/students_fee_record.xlsx';
const LOCAL_CACHE_KEY = 'bursar_excel_cache_v2';

const withTimeout = (promise, ms = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms)),
  ]);
};

export const uploadExcel = async (file) => {
  const storageRef = ref(storage, EXCEL_PATH);
  try {
    await withTimeout(uploadBytes(storageRef, file), 15000);
    const arrayBuffer = await file.arrayBuffer();
    saveLocalCache(arrayBuffer);
  } catch (err) {
    console.warn('Storage upload failed, saving locally:', err.message);
    const arrayBuffer = await file.arrayBuffer();
    saveLocalCache(arrayBuffer);
  }
};

export const downloadExcel = async () => {
  try {
    const storageRef = ref(storage, EXCEL_PATH);
    const bytes = await withTimeout(getBytes(storageRef), 10000);
    saveLocalCache(bytes);
    return bytes;
  } catch (err) {
    console.warn('Storage download failed, trying local cache:', err.message);
    return loadLocalCache();
  }
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
