const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

const admin = require("./firebase-admin");

const db = admin.firestore();
const app = express();
app.use(cors({
  origin: "http://localhost:5173",
}));
app.use(express.json());

// Verify Admin Token
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
  const { name, email, password } = req.body;

  try {
    // Create user in Firebase Auth
    await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // Setup transporter
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      debug: true,
    });

    // Send email
    await transporter.sendMail({
      from: `"Campus Connect" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: "Your CampusConnect Account",
      text: `Hi ${name},\n\nYour account has been created on CampusConnect.\n\nLogin Details:\nEmail: ${email}\nPassword: ${password}\n\nPlease change your password after first login.\n\n- CampusConnect Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Credentials email sent:", info.messageId);

    return res.status(200).json({
      message: "User created and email sent",
      uid: userRecord.uid,
    });
  } catch (error) {
    console.error("Error in /api/createUser:", error);
    if (error.code === "auth/email-already-exists") {
      return res.status(400).json({
        message:
          "This email is already registered. Please use a different email.",
        code: error.code,
      });
    }
    return res.status(500).json({
      message: error.message,
      code: error.code,
      details: error.errorInfo,
    });
  }
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
