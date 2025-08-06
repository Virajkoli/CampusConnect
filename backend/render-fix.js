const fs = require('fs');
const path = require('path');

// Script to create properly formatted JSON for Render environment variables
try {
  const serviceAccountPath = path.join(__dirname, 'service-account-key.json');
  const rawContent = fs.readFileSync(serviceAccountPath, 'utf8');
  const serviceAccount = JSON.parse(rawContent);
  
  // Create JSON with double-escaped newlines for environment variables
  const doubleEscapedJson = JSON.stringify(serviceAccount).replace(/\\n/g, '\\\\n');
  
  console.log('🔥 OPTION 1 - Double Escaped JSON for Render:');
  console.log('='.repeat(80));
  console.log(doubleEscapedJson);
  console.log('='.repeat(80));
  
  console.log('\n🔥 OPTION 2 - Base64 Encoded (Alternative):');
  console.log('='.repeat(80));
  const base64Encoded = Buffer.from(JSON.stringify(serviceAccount)).toString('base64');
  console.log(base64Encoded);
  console.log('='.repeat(80));
  
  console.log('\n📋 Instructions:');
  console.log('Try OPTION 1 first. If that fails, we can modify the code to use OPTION 2 (Base64)');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
