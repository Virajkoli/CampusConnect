const admin = require("firebase-admin");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

// Initialize Firebase Admin with service account
let serviceAccount;

if (process.env.NODE_ENV === "production") {
  // In production, try Base64 encoded service account first, then JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      // Decode Base64 encoded service account
      const base64String = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
      const jsonString = Buffer.from(base64String, 'base64').toString('utf8');
      serviceAccount = JSON.parse(jsonString);
      console.log("✅ Using Firebase service account from Base64 environment variable");
    } catch (error) {
      console.error("❌ Error parsing Base64 Firebase service account:", error);
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable. Please check the Base64 encoding.");
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      // Handle potential formatting issues with newlines
      let jsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      
      // Fix common issues with environment variable formatting
      // Replace literal \n with actual newlines in private key
      jsonString = jsonString.replace(/\\n/g, '\n');
      
      serviceAccount = JSON.parse(jsonString);
      console.log("✅ Using Firebase service account from JSON environment variable");
    } catch (error) {
      console.error("❌ Error parsing Firebase service account JSON:", error);
      console.error("JSON length:", process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.length);
      console.error("First 200 chars:", process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.substring(0, 200));
      
      // Try without newline replacement as fallback
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        console.log("✅ Using Firebase service account (fallback parsing)");
      } catch (fallbackError) {
        console.error("❌ Fallback parsing also failed:", fallbackError);
        throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON environment variable. Please check the JSON formatting.");
      }
    }
  } else {
    // If JSON env var is not set, try file path approach
    console.log("⚠️ FIREBASE_SERVICE_ACCOUNT_JSON not found, trying file path...");
    try {
      serviceAccount = require(process.env.FIREBASE_ADMIN_SDK_KEY || "./service-account-key.json");
      console.log("✅ Using Firebase service account from file");
    } catch (error) {
      console.error("❌ Error loading Firebase service account file:", error);
      throw new Error("Firebase service account configuration not found. Please set FIREBASE_SERVICE_ACCOUNT_JSON environment variable.");
    }
  }
} else {
  // In development, use the file path
  try {
    serviceAccount = require(process.env.FIREBASE_ADMIN_SDK_KEY || "./service-account-key.json");
    console.log("✅ Using Firebase service account from file (development)");
  } catch (error) {
    console.error("❌ Error loading Firebase service account file in development:", error);
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
