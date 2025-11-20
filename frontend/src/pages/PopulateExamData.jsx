import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";
import { FiUpload, FiCheck, FiAlertCircle } from "react-icons/fi";

const PopulateExamData = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const examData = [
    // Friday, 05-12-2025
    {
      date: "Friday, 05-12-2025",
      branch: "Civil",
      year: "4th",
      courseCode: "CE405UX",
      courseName: "Interior Design",
    },
    {
      date: "Friday, 05-12-2025",
      branch: "Computer",
      year: "4th",
      courseCode: "CO405UX",
      courseName: "Software Metrics and Quality Assurance",
    },
    {
      date: "Friday, 05-12-2025",
      branch: "Electrical",
      year: "4th",
      courseCode: "EE405UX",
      courseName: "Electrification of Buildings",
    },
    {
      date: "Friday, 05-12-2025",
      branch: "Electrical",
      year: "4th",
      courseCode: "EE405UY",
      courseName: "Industrial Automation",
    },
    {
      date: "Friday, 05-12-2025",
      branch: "E&TC",
      year: "4th",
      courseCode: "ET404UY",
      courseName: "Wirless Communication Technologies",
    },
    {
      date: "Friday, 05-12-2025",
      branch: "Instrumentation",
      year: "4th",
      courseCode: "IN405UX",
      courseName: "Agricultural Instrumentation",
    },
    {
      date: "Friday, 05-12-2025",
      branch: "Instrumentation",
      year: "4th",
      courseCode: "IN405UZ",
      courseName: "Sensor and Transducers",
    },
    {
      date: "Friday, 05-12-2025",
      branch: "Mechanical",
      year: "4th",
      courseCode: "ME404UX",
      courseName: "Introduction to Robotics",
    },
    // Monday, 08-12-2025
    {
      date: "Monday, 08-12-2025",
      branch: "Civil",
      year: "4th",
      courseCode: "CE401U",
      courseName: "Environmental Engineering",
    },
    {
      date: "Monday, 08-12-2025",
      branch: "Computer",
      year: "4th",
      courseCode: "CO401U",
      courseName: "Compiler Design",
    },
    {
      date: "Monday, 08-12-2025",
      branch: "Electrical",
      year: "4th",
      courseCode: "EE401U",
      courseName: "Electric Drives",
    },
    {
      date: "Monday, 08-12-2025",
      branch: "E&TC",
      year: "4th",
      courseCode: "ET401U",
      courseName: "Computer Communication",
    },
    {
      date: "Monday, 08-12-2025",
      branch: "Instrumentation",
      year: "4th",
      courseCode: "IN401U",
      courseName: "Machine Learning and Data Analytics",
    },
    {
      date: "Monday, 08-12-2025",
      branch: "Mechanical",
      year: "4th",
      courseCode: "ME401U",
      courseName: "Operations Research",
    },
    // Wednesday, 10-12-2025
    {
      date: "Wednesday, 10-12-2025",
      branch: "Civil",
      year: "4th",
      courseCode: "CE402U",
      courseName: "Foundation Engineering",
    },
    {
      date: "Wednesday, 10-12-2025",
      branch: "Computer",
      year: "4th",
      courseCode: "CO402U",
      courseName: "Cryptography and Network Security",
    },
    {
      date: "Wednesday, 10-12-2025",
      branch: "Electrical",
      year: "4th",
      courseCode: "EE402U",
      courseName: "Power System Operation and Control",
    },
    {
      date: "Wednesday, 10-12-2025",
      branch: "E&TC",
      year: "4th",
      courseCode: "ET402UA",
      courseName: "Mobile Communication",
    },
    {
      date: "Wednesday, 10-12-2025",
      branch: "E&TC",
      year: "4th",
      courseCode: "ET402UD",
      courseName: "Very Large Scale Integration Design",
    },
    {
      date: "Wednesday, 10-12-2025",
      branch: "Instrumentation",
      year: "4th",
      courseCode: "IN402U",
      courseName: "Instrumentation Project Management",
    },
    {
      date: "Wednesday, 10-12-2025",
      branch: "Mechanical",
      year: "4th",
      courseCode: "ME402UA",
      courseName: "Refrigeration and Air Conditioning",
    },
    {
      date: "Wednesday, 10-12-2025",
      branch: "Mechanical",
      year: "4th",
      courseCode: "ME402UC",
      courseName: "Tribology",
    },
    // Friday, 12-12-2025
    {
      date: "Friday, 12-12-2025",
      branch: "Civil",
      year: "4th",
      courseCode: "CE403U",
      courseName: "Engineering Economics, Estimate and Costing",
    },
    {
      date: "Friday, 12-12-2025",
      branch: "Computer",
      year: "4th",
      courseCode: "CO403UA",
      courseName: "Image Processing",
    },
    {
      date: "Friday, 12-12-2025",
      branch: "Computer",
      year: "4th",
      courseCode: "CO403UC",
      courseName: "Software Metrics and Quality Assurance",
    },
    {
      date: "Friday, 12-12-2025",
      branch: "Electrical",
      year: "4th",
      courseCode: "EE403UA",
      courseName: "Power System Design",
    },
    {
      date: "Friday, 12-12-2025",
      branch: "Electrical",
      year: "4th",
      courseCode: "EE403UB",
      courseName: "Electrical Machine Design",
    },
    {
      date: "Friday, 12-12-2025",
      branch: "E&TC",
      year: "4th",
      courseCode: "ET403UA",
      courseName: "Internet of Things",
    },
    {
      date: "Friday, 12-12-2025",
      branch: "E&TC",
      year: "4th",
      courseCode: "ET403UB",
      courseName: "Satellite Communication",
    },
    {
      date: "Friday, 12-12-2025",
      branch: "Instrumentation",
      year: "4th",
      courseCode: "IN403UB",
      courseName: "Instrumentation System Design",
    },
    {
      date: "Friday, 12-12-2025",
      branch: "Mechanical",
      year: "4th",
      courseCode: "ME403UC",
      courseName: "Production Planning and Control",
    },
    {
      date: "Friday, 12-12-2025",
      branch: "Mechanical",
      year: "4th",
      courseCode: "ME403UD",
      courseName: "Product Design and Development",
    },
    // Tuesday, 16-12-2025
    {
      date: "Tuesday, 16-12-2025",
      branch: "Civil",
      year: "4th",
      courseCode: "CE404UB",
      courseName: "Advanced R.C.C",
    },
    {
      date: "Tuesday, 16-12-2025",
      branch: "Computer",
      year: "4th",
      courseCode: "CO404UB",
      courseName: "Management Information System",
    },
    {
      date: "Tuesday, 16-12-2025",
      branch: "Computer",
      year: "4th",
      courseCode: "CO404UC",
      courseName: "Data Analytics",
    },
    {
      date: "Tuesday, 16-12-2025",
      branch: "Electrical",
      year: "4th",
      courseCode: "EE404UA",
      courseName: "Smart Grid Technology",
    },
    {
      date: "Tuesday, 16-12-2025",
      branch: "Electrical",
      year: "4th",
      courseCode: "EE404UB",
      courseName: "Industrial Safety",
    },
    {
      date: "Tuesday, 16-12-2025",
      branch: "Electrical",
      year: "4th",
      courseCode: "EE404UC",
      courseName: "Industrial Electrical Systems",
    },
    {
      date: "Tuesday, 16-12-2025",
      branch: "E&TC",
      year: "4th",
      courseCode: "SH426U",
      courseName: "Accounts and Finance for Entrepreneurs",
    },
    {
      date: "Tuesday, 16-12-2025",
      branch: "Instrumentation",
      year: "4th",
      courseCode: "IN404UA",
      courseName: "Automotive Instrumentation",
    },
    {
      date: "Tuesday, 16-12-2025",
      branch: "Mechanical",
      year: "4th",
      courseCode: "ME405UD",
      courseName: "CAD/CAM",
    },
    // Thursday, 18-12-2025
    {
      date: "Thursday, 18-12-2025",
      branch: "Computer",
      year: "4th",
      courseCode: "CO452UJ",
      courseName: "Cloud Computing (Option-II)",
    },
  ];

  const handlePopulate = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);
    setProgress({ current: 0, total: examData.length });

    try {
      const examRef = collection(db, "examTimetable");

      for (let i = 0; i < examData.length; i++) {
        await addDoc(examRef, examData[i]);
        setProgress({ current: i + 1, total: examData.length });
        // Small delay to show progress
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error("Error populating data:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiUpload className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Populate Exam Timetable
          </h1>
          <p className="text-gray-600">
            This will add {examData.length} exam entries to the database
          </p>
        </div>

        {/* Data Summary */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-gray-800 mb-3">Data Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Exams:</span>
              <span className="font-bold text-gray-800 ml-2">
                {examData.length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Exam Dates:</span>
              <span className="font-bold text-gray-800 ml-2">6</span>
            </div>
            <div>
              <span className="text-gray-600">Branches:</span>
              <span className="font-bold text-gray-800 ml-2">6</span>
            </div>
            <div>
              <span className="text-gray-600">Month:</span>
              <span className="font-bold text-gray-800 ml-2">Dec 2025</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {loading && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Uploading...</span>
              <span>
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(progress.current / progress.total) * 100}%`,
                }}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-600"
              />
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
          >
            <FiCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-green-800 font-semibold">Success!</p>
              <p className="text-green-600 text-sm">
                All {examData.length} exam entries have been added to the
                database.
              </p>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
          >
            <FiAlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: success ? 1 : 1.02 }}
          whileTap={{ scale: success ? 1 : 0.98 }}
          onClick={handlePopulate}
          disabled={loading || success}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            success
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : loading
              ? "bg-gray-400 text-white cursor-wait"
              : "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg hover:shadow-xl"
          }`}
        >
          {loading
            ? "Populating..."
            : success
            ? "✓ Data Populated"
            : "Populate Exam Data"}
        </motion.button>

        {/* Warning */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-yellow-800 text-sm">
            <strong>⚠️ Warning:</strong> This will add all entries to the
            database. Make sure this is what you want to do. Use the Admin Exam
            Timetable page to manage entries after population.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default PopulateExamData;
