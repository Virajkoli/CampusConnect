import React, { useState, useEffect } from 'react';
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "../firebase";

export default function TeacherDashboard() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;

      if (currentUser) {
        setUser(currentUser);

        // Agar displayName nahi hai, toh Firestore se naam fetch karo
        if (!currentUser.displayName) {
          const docRef = doc(firestore, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            // Firestore mein naam hai, use karna
            const firestoreName = docSnap.data().displayName || "N/A";
            setName(firestoreName);  // Agar naam hai toh wahi set karo
          } else {
            setName("N/A");  // Agar Firestore mein naam nahi hai
          }
        } else {
          setName(currentUser.displayName);  // Agar displayName already hai
        }
      } else {
        navigate("/auth/teacher");  // Agar user logged in nahi hai
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Teacher Dashboard</h1>
        <div className="bg-gray-50 p-4 rounded-md shadow-sm">
          <p className="text-xl text-gray-600">
            <strong className="font-semibold">Name:</strong> {name || "N/A"}
          </p>
          <p className="text-xl text-gray-600">
            <strong className="font-semibold">Email:</strong> {user?.email}
          </p>
        </div>
        <div className="mt-6">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}
