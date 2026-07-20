import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './config';

export const loginAdmin = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const logoutAdmin = async () => {
  await signOut(auth);
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
