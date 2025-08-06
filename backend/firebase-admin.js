const admin = require("firebase-admin");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

// Initialize Firebase Admin with service account
let serviceAccount;

if (process.env.NODE_ENV === "production") {
  // In production, first try to use environment variable containing the entire JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      console.log(
        "✅ Using Firebase service account from environment variable"
      );
    } catch (error) {
      console.error("❌ Error parsing Firebase service account JSON:", error);
      throw new Error(
        "Invalid FIREBASE_SERVICE_ACCOUNT_JSON environment variable"
      );
    }
  } else {
    // If JSON env var is not set, try file path approach
    console.log(
      "⚠️ FIREBASE_SERVICE_ACCOUNT_JSON not found, trying file path..."
    );
    try {
      serviceAccount = require(process.env.FIREBASE_ADMIN_SDK_KEY ||
        "./service-account-key.json");
      console.log("✅ Using Firebase service account from file");
    } catch (error) {
      console.error("❌ Error loading Firebase service account file:", error);
      throw new Error(
        "Firebase service account configuration not found. Please set FIREBASE_SERVICE_ACCOUNT_JSON environment variable."
      );
    }
  }
} else {
  // In development, use the file path
  try {
    serviceAccount = require(process.env.FIREBASE_ADMIN_SDK_KEY ||
      "./service-account-key.json");
    console.log("✅ Using Firebase service account from file (development)");
  } catch (error) {
    console.error(
      "❌ Error loading Firebase service account file in development:",
      error
    );
    throw error;
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
  storageBucket: `${serviceAccount.project_id}.appspot.com`,
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
});

module.exports = admin;
