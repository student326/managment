import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';

const EXCEL_PATH = 'excel/students_fee_record.xlsx';

export const uploadExcel = async (file) => {
  const storageRef = ref(storage, EXCEL_PATH);
  await uploadBytes(storageRef, file);
  return EXCEL_PATH;
};

export const downloadExcel = async () => {
  const storageRef = ref(storage, EXCEL_PATH);
  try {
    const bytes = await getBytes(storageRef);
    return bytes;
  } catch (err) {
    if (err.code === 'storage/object-not-found') {
      return null;
    }
    throw err;
  }
};

export const deleteExcel = async () => {
  const storageRef = ref(storage, EXCEL_PATH);
  await deleteObject(storageRef);
};
