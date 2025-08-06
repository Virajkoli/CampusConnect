const fs = require("fs");
const path = require("path");

// Script to create properly escaped JSON for environment variables
try {
  const serviceAccountPath = path.join(__dirname, "service-account-key.json");
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
  );

  // Create a properly escaped version for environment variables
  // This ensures all special characters are properly escaped
  const escapedJson = JSON.stringify(JSON.stringify(serviceAccount));

  // Remove the outer quotes (since we just want the escaped content)
  const envReadyJson = escapedJson.slice(1, -1);

  console.log("🔥 PROPERLY ESCAPED Firebase Service Account JSON for Render:");
  console.log(
    "================================================================"
  );
  console.log(envReadyJson);
  console.log(
    "================================================================"
  );
  console.log(
    "\n📋 Copy the above JSON and paste it as FIREBASE_SERVICE_ACCOUNT_JSON environment variable in Render"
  );
  console.log(
    "\n⚠️  This version has properly escaped newlines and quotes for environment variables"
  );
} catch (error) {
  console.error("❌ Error reading service-account-key.json:", error.message);
  console.log(
    "📝 Make sure service-account-key.json exists in the backend folder"
  );
}
