import { supabase } from '../supabase/config';

const BUCKET_NAME = 'excel';
const FILE_PATH = 'students_fee_record.xlsx';
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
  if (inflightUpload) {
    try { await inflightUpload; } catch {}
    inflightUpload = null;
  }

  const uploadPromise = (async () => {
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(FILE_PATH, file, { upsert: true });

      if (error) {
        console.warn('[Storage] Upload failed:', error.message);
      } else {
        console.log('[Storage] Upload OK');
      }

      if (rawArrayBuffer) saveLocalCache(rawArrayBuffer);
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
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(FILE_PATH);

    if (error) {
      console.warn('[Storage] Cloud download failed:', error.message);
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    saveLocalCache(arrayBuffer);
    return arrayBuffer;
  } catch (err) {
    console.warn('[Storage] Cloud download failed:', err.message);
    return null;
  }
};

const fetchFromCloud = async () => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(FILE_PATH);

    if (error) {
      console.warn('[Storage] Background sync failed:', error.message);
      return;
    }

    const arrayBuffer = await data.arrayBuffer();
    saveLocalCache(arrayBuffer);
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
    await supabase.storage.from(BUCKET_NAME).remove([FILE_PATH]);
  } catch {}
  localStorage.removeItem(LOCAL_CACHE_KEY);
};
