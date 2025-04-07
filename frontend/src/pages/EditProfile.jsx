import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";


function EditProfile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setName(currentUser.displayName || "");
      setPhotoURL(currentUser.photoURL || "");
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;
  
    setLoading(true);
    try {
      // 👇 yeh line sahi jagah hai!
      await updateProfile(auth.currentUser, {
        displayName: name,
        photoURL: photoURL,
      });
      
  
      // 👇 Yeh ensure karega ke latest data mil jaaye
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
  
      setUser(updatedUser);
      setName(updatedUser.displayName || "");
      setPhotoURL(updatedUser.photoURL || "");
  
      setLoading(false);
      navigate("/profile");
    } catch (error) {
      console.error("Profile update error:", error);
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">✏️ Edit Profile</h1>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Photo URL</label>
            <input
              type="text"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${
                loading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
              } text-white px-4 py-2 rounded-lg`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
