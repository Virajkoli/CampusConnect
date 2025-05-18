import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithEmailPassword, auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export default function AdminAuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [user, loading] = useAuthState(auth);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const tokenResult = await user.getIdTokenResult(true);
        if (tokenResult.claims.admin) {
          navigate("/admin-dashboard");
        }
      }
      setCheckingAdmin(false);
    };

    checkAdmin();
  }, [user, navigate]);

  // ❗ Show nothing until auth AND admin check both complete
  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-700 text-lg">Checking admin status...</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await loginWithEmailPassword(email, password);
      const user = auth.currentUser;

      if (user) {
        const tokenResult = await user.getIdTokenResult(true);
        if (tokenResult.claims.admin) {
          navigate("/admin-dashboard");
        } else {
          setError("❌ You are not authorized as admin.");
        }
      }
    } catch (err) {
      setError("❌ " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6 tracking-tight">
          Admin Login
        </h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded px-3 py-2 mb-4 text-center text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:outline-none text-gray-800 bg-white"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:outline-none text-gray-800 bg-white"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 transition-colors text-white py-2 rounded font-semibold shadow text-base"
          >
            Login as Admin
          </button>
          <div className="flex flex-col items-center mt-2 gap-1">
            <button
              onClick={() => navigate("/login")}
              type="button"
              className="text-indigo-600 hover:underline text-sm"
            >
              ← Back to Role Selection
            </button>
            <button
              type="button"
              onClick={() => navigate("/reset-password")}
              className="text-purple-600 hover:underline text-xs mt-1"
            >
              Forgot password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
