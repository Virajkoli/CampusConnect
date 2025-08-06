const fs = require("fs");
const path = require("path");

// Script to minify service-account-key.json for Render deployment
try {
  const serviceAccountPath = path.join(__dirname, "service-account-key.json");
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
  );

  // Minify JSON (remove all spaces and newlines)
  const minifiedJson = JSON.stringify(serviceAccount);

  console.log("🔥 Minified Firebase Service Account JSON for Render:");
  console.log("=====================================");
  console.log(minifiedJson);
  console.log("=====================================");
  console.log(
    "\n📋 Copy the above JSON and paste it as FIREBASE_SERVICE_ACCOUNT_JSON environment variable in Render"
  );
} catch (error) {
  console.error("❌ Error reading service-account-key.json:", error.message);
  console.log(
    "📝 Make sure service-account-key.json exists in the backend folder"
  );
}
