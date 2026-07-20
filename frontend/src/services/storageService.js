import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';

const EXCEL_PATH = 'excel/students_fee_record.xlsx';
const LOCAL_CACHE_KEY = 'bursar_excel_cache';

const withTimeout = (promise, ms = 15000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
};

export const uploadExcel = async (file) => {
  const storageRef = ref(storage, EXCEL_PATH);
  await withTimeout(uploadBytes(storageRef, file), 20000);
  try {
    const arrayBuffer = await file.arrayBuffer();
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(Array.from(new Uint8Array(arrayBuffer))));
  } catch {}
  return EXCEL_PATH;
};

export const downloadExcel = async () => {
  try {
    const storageRef = ref(storage, EXCEL_PATH);
    const bytes = await withTimeout(getBytes(storageRef), 15000);
    try {
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(Array.from(new Uint8Array(bytes))));
    } catch {}
    return bytes;
  } catch (err) {
    if (err.code === 'storage/object-not-found') {
      return loadFromLocalCache();
    }
    return loadFromLocalCache();
  }
};

const loadFromLocalCache = () => {
  try {
    const cached = localStorage.getItem(LOCAL_CACHE_KEY);
    if (!cached) return null;
    const arr = new Uint8Array(JSON.parse(cached));
    return arr.buffer;
  } catch {
    return null;
  }
};

export const deleteExcel = async () => {
  try {
    const storageRef = ref(storage, EXCEL_PATH);
    await deleteObject(storageRef);
  } catch {}
  localStorage.removeItem(LOCAL_CACHE_KEY);
};
