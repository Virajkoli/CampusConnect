const admin = require("firebase-admin");
const dotenv = require("dotenv");
dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert(require("./service-account-key.json")),
});

async function setTeacher(email) {
  try {
    // Firebase Authentication Custom Claims
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { teacher: true });

    console.log(`✅ Teacher claim set for: ${email}`);

    // Firestore Entry
    const firestore = admin.firestore();
    await firestore.collection("users").doc(user.uid).set({
      email: email,
      role: "teacher",
      createdAt: new Date().toISOString(),
      displayName: name,
    });

    console.log(`✅ Firestore entry added for teacher: ${email}`);
  } catch (error) {
    console.error("❌ Error setting teacher claim:", error);
  }
}

// YAHAN TEACHER EMAIL DAALO
setTeacher("ks12@gmail.com");
