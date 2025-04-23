const admin = require("firebase-admin");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

// Initialize Firebase Admin with service account
const serviceAccount = require(process.env.FIREBASE_ADMIN_SDK_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
  storageBucket: `${serviceAccount.project_id}.appspot.com`,
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
});

module.exports = admin;
