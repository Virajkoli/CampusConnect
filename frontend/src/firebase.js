import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { getFirestore } from "@firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqhlUsTMQid5fBO4YMZdXi32Iymv2u-w4",
  authDomain: "campusconnect-c1fbd.firebaseapp.com",
  projectId: "campusconnect-c1fbd",
  storageBucket: "campusconnect-c1fbd.firebasestorage.app",
  messagingSenderId: "716973984569",
  appId: "1:716973984569:web:9ea868906eaf3458a4f6e8",
  measurementId: "G-S8L26RWM7S",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);
export const db = getFirestore(app);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export { firestore };

export const signUpWithEmailPassword = async (email, password,name) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: name });
  return userCredential;
};

export const loginWithEmailPassword = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};
