const admin = require("firebase-admin");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

// Initialize Firebase Admin with service account
let serviceAccount;

if (process.env.NODE_ENV === "production") {
  // In production, use environment variable containing the entire JSON
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (error) {
    console.error("Error parsing Firebase service account JSON:", error);
    // Fallback to file path if JSON parsing fails
    serviceAccount = require(process.env.FIREBASE_ADMIN_SDK_KEY ||
      "./service-account-key.json");
  }
} else {
  // In development, use the file path
  serviceAccount = require(process.env.FIREBASE_ADMIN_SDK_KEY ||
    "./service-account-key.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
  storageBucket: `${serviceAccount.project_id}.appspot.com`,
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
});

module.exports = admin;
