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
import { getStorage } from "firebase/storage";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAaqKQWQuQZyPnrUieCUkRh3GrfKqucdOw",
  authDomain: "campus-connect-9e92e.firebaseapp.com",
  projectId: "campus-connect-9e92e",
  storageBucket: "campus-connect-9e92e.appspot.com", 
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
const storage = getStorage(app);

// Auth functions
export const signUpWithEmailPassword = async (email, password, name) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  await updateProfile(userCredential.user, { displayName: name });
  return userCredential;
};

export const loginWithEmailPassword = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const createTeacherAccount = async (email, password, name) => {
  // Create a teacher account with Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // Update the profile with the provided name
  await updateProfile(userCredential.user, {
    displayName: name});

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

// Helper function to check if a user has teacher role
export const checkTeacherRole = async (user) => {
  if (!user) return false;

  try {
    // Force refresh token to get the latest custom claims
    await user.getIdToken(true);
    const tokenResult = await user.getIdTokenResult();
    return !!tokenResult.claims.teacher;
  } catch (error) {
    console.error("Error checking teacher role:", error);
    return false;
  }
};

// Export everything
export { auth, firestore, provider, db, storage };
