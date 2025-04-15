// setAdmin.js
const admin = require("firebase-admin");
const dotenv = require("dotenv");
dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert(require("./service-account-key.json")),
  
});

async function setAdmin(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ Admin claim set for: ${email}`);
  } catch (error) {
    console.error("❌ Error setting admin claim:", error);
  }
}

// YAHAN APNA ADMIN EMAIL DAALO
setAdmin("admin1234@gmail.com");
