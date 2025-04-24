const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

const admin = require("./firebase-admin");

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.json());

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

// Create Firebase User and Send Email
app.post("/api/createUser", async (req, res) => {
  const { name, email, password, rollNo, dept } = req.body;

  try {
    console.log("Starting user creation process for:", email);

    // First check if the email exists in Firebase Auth
    let existingUser = null;
    try {
      console.log("Checking if email exists in Firebase Auth...");
      existingUser = await admin.auth().getUserByEmail(email);
      console.log("Email exists in Firebase Auth with UID:", existingUser.uid);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        console.log(
          "Email does not exist in Firebase Auth, can proceed with creation"
        );
      } else {
        console.error("Error checking email existence:", error);
        throw error;
      }
    }

    if (existingUser) {
      console.log("Email already exists, checking Firestore...");
      // Check if user exists in Firestore
      const firestore = admin.firestore();
      const userDoc = await firestore
        .collection("users")
        .where("email", "==", email)
        .get();

      if (userDoc.empty) {
        console.log(
          "User exists in Auth but not in Firestore, adding to Firestore..."
        );
        // Add to Firestore
        await firestore.collection("users").add({
          name,
          email,
          uid: userRecord.uid,
          rollNo,
          dept,
          role,
          createdAt: new Date().toISOString(),
        });

        // Send notification email
        console.log("Sending notification email to existing user...");
        const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
          },
          debug: true,
        });

        try {
          await transporter.verify();
          console.log("Email transporter verified");
        } catch (e) {
          console.error("SMTP verification failed:", e);
        }

        const mailOptions = {
          from: `"Campus Connect" <${process.env.EMAIL_USERNAME}>`,
          to: email,
          subject: "Your CampusConnect Account",
          text: `Hi ${name},\n\nYour account already exists in CampusConnect.\n\nPlease use your existing credentials to log in.\n\n- CampusConnect Team`,
        };

        // const info = await transporter.sendMail(mailOptions);
        // console.log("Notification email sent:", info.messageId);

        try {
          const info = await transporter.sendMail(mailOptions);
          console.log("Credentials email sent:", info.messageId);

          return res.status(200).json({
            message: "User created and email sent",
            uid: userRecord.uid,
          });
        } catch (err) {
          console.error("Email sending failed:", err);
          return res.status(200).json({
            message:
              "User created successfully, but failed to send credentials email.",
            uid: userRecord.uid,
            emailError: err.message,
          });
        }

        return res.status(200).json({
          message:
            "User already exists. Added to Firestore and sent notification email.",
          existingUser: true,
        });
      } else {
        console.log("User exists in both Auth and Firestore");
        return res.status(400).json({
          message: "User already exists in both Firebase Auth and Firestore",
          existingUser: true,
        });
      }
    }

    // If we get here, the email doesn't exist in Firebase Auth
    console.log("Creating new user in Firebase Auth...");
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });
    console.log("New user created successfully with UID:", userRecord.uid);

    // Add to Firestore
    console.log("Adding user to Firestore...");
    const firestore = admin.firestore();
    await firestore.collection("users").doc(userRecord.uid).set({
      name,
      email,
      uid: userRecord.uid,
      rollNo,
      dept,
      role: "Student",
    });

    console.log("User added to Firestore successfully");

    // Send credentials email
    console.log("Setting up email transporter for new user...");
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      debug: true,
    });

    await transporter.verify();
    console.log("Email transporter verified");

    const mailOptions = {
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

// Delete user endpoint
app.post("/api/deleteUser", async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Delete user from Firebase Auth
    await admin.auth().deleteUser(uid);

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/test-mail", async (req, res) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"CampusConnect" <${process.env.EMAIL_USERNAME}>`,
      to: "koliviraj555@gmail.com",
      subject: "Test Email",
      text: "Yeh test email hai from Nodemailer",
    });

    res.send("Test email sent: " + info.messageId);
  } catch (err) {
    console.error("Test mail error:", err);
    res.status(500).send("Error sending test mail: " + err.message);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
