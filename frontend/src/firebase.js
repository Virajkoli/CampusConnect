// firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAaqKQWQuQZyPnrUieCUkRh3GrfKqucdOw",
  authDomain: "campus-connect-9e92e.firebaseapp.com",
  projectId: "campus-connect-9e92e",
  storageBucket: "campus-connect-9e92e.firebasestorage.app",
  messagingSenderId: "268286454476",
  appId: "1:268286454476:web:a70a7e0f77ceef75d3b069",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const provider = new GoogleAuthProvider();

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
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // Name set karna
  await updateProfile(userCredential.user, { displayName: name });

  return userCredential;
};
