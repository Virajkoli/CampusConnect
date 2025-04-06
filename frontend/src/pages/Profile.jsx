import { auth } from "../firebase";

function Profile() {
  const user = auth.currentUser;

  return (
    <div className="flex flex-col items-center mt-10">
      <h1 className="text-3xl font-bold mb-2">Welcome, {user?.displayName || "User"}</h1>
      <p className="text-lg">Email: {user?.email}</p>
    </div>
  );
}

export default Profile;
