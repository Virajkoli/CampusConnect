import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAaqKQWQuQZyPnrUieCUkRh3GrfKqucdOw",
  authDomain: "campus-connect-9e92e.firebaseapp.com",
  projectId: "campus-connect-9e92e",
  storageBucket: "campus-connect-9e92e.appspot.com", // Typo corrected here too ("storageBucket" me ".app" hata ke ".com")
  messagingSenderId: "268286454476",
  appId: "1:268286454476:web:a70a7e0f77ceef75d3b069",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
const auth = getAuth(app);
const firestore = getFirestore(app);
const provider = new GoogleAuthProvider();
const db = firestore; // 🆕 Make alias for easier imports

// Auth functions
export const signUpWithEmailPassword = async (email, password, name) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: name });
  return userCredential;
};

export const loginWithEmailPassword = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const createTeacherAccount = async (email, password, name) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: name });
  return userCredential;
};

// Set Persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    // Persistence set successfully
  })
  .catch((error) => {
    console.error("Persistence error:", error);
  });

// Export everything
export { auth, firestore, provider, db };
