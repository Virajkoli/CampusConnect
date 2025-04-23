const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert(require("./service-account-key.json")),
  databaseURL: "https://campus-connect-9e92e-default-rtdb.firebaseio.com",
});

const db = admin.firestore();
const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

/* ============================
   ✅ Verify Admin Token
=============================== */
app.post("/verify-admin", async (req, res) => {
  const { token } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (decodedToken.admin) {
      res.status(200).send({ message: "Authorized as admin" });
    } else {
      res.status(403).send({ message: "Not authorized" });
    }
  } catch (error) {
    res.status(401).send({ message: "Invalid token", error });
  }
});

/* ============================
   ✅ Create User + Send Email
=============================== */
app.post("/api/createUser", async (req, res) => {
  const { name, email, password, role = "student" } = req.body;

  try {
    await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    await db.collection("users").doc(email).set({
      name,
      email,
      role,
      createdAt: admin.firestore.Timestamp.now(),
    });

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Campus Connect" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: "Your CampusConnect Account",
      text: `Hi ${name},\n\nYour account has been created on CampusConnect.\n\nLogin Details:\nEmail: ${email}\nPassword: ${password}\n\nPlease change your password after first login.\n\n- CampusConnect Team`,
    });

    res.status(200).json({ message: "User created and email sent" });
  } catch (error) {
    console.error("Error in /api/createUser:", error);
    res.status(500).json({ message: error.message });
  }
});

/* ============================
   ✅ Delete User
=============================== */
app.delete("/api/deleteUser/:email", async (req, res) => {
  const { email } = req.params;

  try {
    // Try to get the user from Firebase Auth
    const user = await admin.auth().getUserByEmail(email);

    // Delete from Firebase Auth
    await admin.auth().deleteUser(user.uid);
    console.log("✅ Firebase Auth user deleted:", email);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      console.warn("⚠️ No Firebase Auth user found, skipping auth delete.");
    } else {
      console.error("❌ Error during auth delete:", error);
      return res.status(500).json({ message: "Auth delete failed", error });
    }
  }

  try {
    // Delete from Firestore
    await admin.firestore().collection("users").doc(email).delete();
    console.log("✅ Firestore user deleted:", email);

    res.status(200).json({ message: "User deleted from Auth (if existed) and Firestore" });
  } catch (error) {
    console.error("❌ Error during Firestore delete:", error);
    res.status(500).json({ message: "Firestore delete failed", error });
  }
});


/* ============================
   ✅ Update User
=============================== */
app.put("/api/updateUser/:email", async (req, res) => {
  const { email } = req.params;
  const { newName, newEmail, role } = req.body;

  try {
    const user = await admin.auth().getUserByEmail(email);

    await admin.auth().updateUser(user.uid, {
      email: newEmail,
      displayName: newName,
    });

    await db.collection("users").doc(email).delete(); // old
    await db.collection("users").doc(newEmail).set({
      name: newName,
      email: newEmail,
      role,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: error.message });
  }
});

/* ============================
   ✅ Start Server
=============================== */
const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
