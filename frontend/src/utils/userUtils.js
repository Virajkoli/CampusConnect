import { setDoc, doc } from "firebase/firestore";
import { auth, firestore } from "../firebase";

export const updateFirestoreUser = async () => {
  const user = auth.currentUser;
  if (user) {
    await setDoc(doc(firestore, "users", user.uid), {
      email: user.email,
      displayName: user.displayName || "Default Name",
      role: "teacher",
    }, { merge: true });
    console.log("User data updated in Firestore!");
  }
};
