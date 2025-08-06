const fs = require("fs");
const path = require("path");

// Script to create the EXACT JSON for Render environment variables
try {
  const serviceAccountPath = path.join(__dirname, "service-account-key.json");
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
  );

  // For Render environment variables, we need the raw JSON but minified
  const minifiedJson = JSON.stringify(serviceAccount);

  console.log("🔥 EXACT JSON for Render Environment Variable:");
  console.log("=".repeat(80));
  console.log(minifiedJson);
  console.log("=".repeat(80));
  console.log("\n📋 Steps to use:");
  console.log("1. Copy the EXACT JSON above (everything between the = lines)");
  console.log("2. Go to Render → Your Service → Environment tab");
  console.log("3. Variable Key: FIREBASE_SERVICE_ACCOUNT_JSON");
  console.log("4. Variable Value: Paste the JSON (no quotes around it)");
  console.log("5. Save and redeploy");
} catch (error) {
  console.error("❌ Error reading service-account-key.json:", error.message);
}
