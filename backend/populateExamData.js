// Script to populate exam timetable data
// Run this in the browser console or as a Node.js script with Firebase Admin SDK

const examData = [
  // Friday, 05-12-2025
  {
    date: "Friday, 05-12-2025",
    branch: "Civil",
    courseCode: "CE405UX",
    courseName: "Interior Design",
  },
  {
    date: "Friday, 05-12-2025",
    branch: "Computer",
    courseCode: "CO405UX",
    courseName: "Software Metrics and Quality Assurance",
  },
  {
    date: "Friday, 05-12-2025",
    branch: "Electrical",
    courseCode: "EE405UX",
    courseName: "Electrification of Buildings",
  },
  {
    date: "Friday, 05-12-2025",
    branch: "Electrical",
    courseCode: "EE405UY",
    courseName: "Industrial Automation",
  },
  {
    date: "Friday, 05-12-2025",
    branch: "E&TC",
    courseCode: "ET404UY",
    courseName: "Wirless Communication Technologies",
  },
  {
    date: "Friday, 05-12-2025",
    branch: "Instrumentation",
    courseCode: "IN405UX",
    courseName: "Agricultural Instrumentation",
  },
  {
    date: "Friday, 05-12-2025",
    branch: "Instrumentation",
    courseCode: "IN405UZ",
    courseName: "Sensor and Transducers",
  },
  {
    date: "Friday, 05-12-2025",
    branch: "Mechanical",
    courseCode: "ME404UX",
    courseName: "Introduction to Robotics",
  },

  // Monday, 08-12-2025
  {
    date: "Monday, 08-12-2025",
    branch: "Civil",
    courseCode: "CE401U",
    courseName: "Environmental Engineering",
  },
  {
    date: "Monday, 08-12-2025",
    branch: "Computer",
    courseCode: "CO401U",
    courseName: "Compiler Design",
  },
  {
    date: "Monday, 08-12-2025",
    branch: "Electrical",
    courseCode: "EE401U",
    courseName: "Electric Drives",
  },
  {
    date: "Monday, 08-12-2025",
    branch: "E&TC",
    courseCode: "ET401U",
    courseName: "Computer Communication",
  },
  {
    date: "Monday, 08-12-2025",
    branch: "Instrumentation",
    courseCode: "IN401U",
    courseName: "Machine Learning and Data Analytics",
  },
  {
    date: "Monday, 08-12-2025",
    branch: "Mechanical",
    courseCode: "ME401U",
    courseName: "Operations Research",
  },

  // Wednesday, 10-12-2025
  {
    date: "Wednesday, 10-12-2025",
    branch: "Civil",
    courseCode: "CE402U",
    courseName: "Foundation Engineering",
  },
  {
    date: "Wednesday, 10-12-2025",
    branch: "Computer",
    courseCode: "CO402U",
    courseName: "Cryptography and Network Security",
  },
  {
    date: "Wednesday, 10-12-2025",
    branch: "Electrical",
    courseCode: "EE402U",
    courseName: "Power System Operation and Control",
  },
  {
    date: "Wednesday, 10-12-2025",
    branch: "E&TC",
    courseCode: "ET402UA",
    courseName: "Mobile Communication",
  },
  {
    date: "Wednesday, 10-12-2025",
    branch: "E&TC",
    courseCode: "ET402UD",
    courseName: "Very Large Scale Integration Design",
  },
  {
    date: "Wednesday, 10-12-2025",
    branch: "Instrumentation",
    courseCode: "IN402U",
    courseName: "Instrumentation Project Management",
  },
  {
    date: "Wednesday, 10-12-2025",
    branch: "Mechanical",
    courseCode: "ME402UA",
    courseName: "Refrigeration and Air Conditioning",
  },
  {
    date: "Wednesday, 10-12-2025",
    branch: "Mechanical",
    courseCode: "ME402UC",
    courseName: "Tribology",
  },

  // Friday, 12-12-2025
  {
    date: "Friday, 12-12-2025",
    branch: "Civil",
    courseCode: "CE403U",
    courseName: "Engineering Economics, Estimate and Costing",
  },
  {
    date: "Friday, 12-12-2025",
    branch: "Computer",
    courseCode: "CO403UA",
    courseName: "Image Processing",
  },
  {
    date: "Friday, 12-12-2025",
    branch: "Computer",
    courseCode: "CO403UC",
    courseName: "Software Metrics and Quality Assurance",
  },
  {
    date: "Friday, 12-12-2025",
    branch: "Electrical",
    courseCode: "EE403UA",
    courseName: "Power System Design",
  },
  {
    date: "Friday, 12-12-2025",
    branch: "Electrical",
    courseCode: "EE403UB",
    courseName: "Electrical Machine Design",
  },
  {
    date: "Friday, 12-12-2025",
    branch: "E&TC",
    courseCode: "ET403UA",
    courseName: "Internet of Things",
  },
  {
    date: "Friday, 12-12-2025",
    branch: "E&TC",
    courseCode: "ET403UB",
    courseName: "Satellite Communication",
  },
  {
    date: "Friday, 12-12-2025",
    branch: "Instrumentation",
    courseCode: "IN403UB",
    courseName: "Instrumentation System Design",
  },
  {
    date: "Friday, 12-12-2025",
    branch: "Mechanical",
    courseCode: "ME403UC",
    courseName: "Production Planning and Control",
  },
  {
    date: "Friday, 12-12-2025",
    branch: "Mechanical",
    courseCode: "ME403UD",
    courseName: "Product Design and Development",
  },

  // Tuesday, 16-12-2025
  {
    date: "Tuesday, 16-12-2025",
    branch: "Civil",
    courseCode: "CE404UB",
    courseName: "Advanced R.C.C",
  },
  {
    date: "Tuesday, 16-12-2025",
    branch: "Computer",
    courseCode: "CO404UB",
    courseName: "Management Information System",
  },
  {
    date: "Tuesday, 16-12-2025",
    branch: "Computer",
    courseCode: "CO404UC",
    courseName: "Data Analytics",
  },
  {
    date: "Tuesday, 16-12-2025",
    branch: "Electrical",
    courseCode: "EE404UA",
    courseName: "Smart Grid Technology",
  },
  {
    date: "Tuesday, 16-12-2025",
    branch: "Electrical",
    courseCode: "EE404UB",
    courseName: "Industrial Safety",
  },
  {
    date: "Tuesday, 16-12-2025",
    branch: "Electrical",
    courseCode: "EE404UC",
    courseName: "Industrial Electrical Systems",
  },
  {
    date: "Tuesday, 16-12-2025",
    branch: "E&TC",
    courseCode: "SH426U",
    courseName: "Accounts and Finance for Entrepreneurs",
  },
  {
    date: "Tuesday, 16-12-2025",
    branch: "Instrumentation",
    courseCode: "IN404UA",
    courseName: "Automotive Instrumentation",
  },
  {
    date: "Tuesday, 16-12-2025",
    branch: "Mechanical",
    courseCode: "ME405UD",
    courseName: "CAD/CAM",
  },

  // Thursday, 18-12-2025
  {
    date: "Thursday, 18-12-2025",
    branch: "Computer",
    courseCode: "CO452UJ",
    courseName: "Cloud Computing (Option-II)",
  },
];

// Function to add data to Firestore (Browser version - requires Firebase initialized)
async function populateExamTimetable() {
  // Make sure firebase is initialized in your app
  const db = firebase.firestore();

  try {
    console.log("Starting to populate exam timetable...");

    for (const exam of examData) {
      await db.collection("examTimetable").add(exam);
      console.log(`Added: ${exam.courseCode} - ${exam.courseName}`);
    }

    console.log("✅ Successfully populated all exam data!");
  } catch (error) {
    console.error("Error populating data:", error);
  }
}

// Uncomment below line and run in browser console (with Firebase initialized)
// populateExamTimetable();

// For Node.js with Firebase Admin SDK:
/*
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function populateExamTimetableAdmin() {
  const batch = db.batch();
  
  examData.forEach((exam) => {
    const docRef = db.collection('examTimetable').doc();
    batch.set(docRef, exam);
  });
  
  try {
    await batch.commit();
    console.log('✅ Successfully populated all exam data!');
  } catch (error) {
    console.error('Error populating data:', error);
  }
}

populateExamTimetableAdmin();
*/

console.log("Exam data ready to be populated. Total exams:", examData.length);
console.log("Unique dates:", [...new Set(examData.map((e) => e.date))].length);
console.log(
  "Branches:",
  [...new Set(examData.map((e) => e.branch))].join(", ")
);
