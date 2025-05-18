const admin = require("firebase-admin");
const dotenv = require("dotenv");
dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert(require("./service-account-key.json")),
});

async function setTeacher(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { teacher: true });

    console.log(`✅ Teacher claim set for: ${email}`);

    const firestore = admin.firestore();
    await firestore.collection("users").doc(user.uid).set({
      email: email,
      role: "teacher",
      createdAt: new Date().toISOString(),
      displayName: user.displayName || "", // ✅ FIXED
    });

    console.log(`✅ Firestore entry added for teacher: ${email}`);
  } catch (error) {
    console.error("❌ Error setting teacher claim:", error);
  }
}

// ✅ Call function
setTeacher("ks12@gmail.com");