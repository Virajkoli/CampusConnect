export const BRANCHES = [
  "Computer Engineering",
  "Electronics And TeleCommunication Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Instrumentation Engineering",
];

export const YEARS = ["1st", "2nd", "3rd", "4th"];
export const SEMESTERS = ["1", "2"];

const LEGACY_DEFAULT_SUBJECT_SETS = {
  "Computer Engineering": {
    "1st": [
      "Introduction to Programming",
      "Mathematics I",
      "Physics",
      "Chemistry",
      "Environmental Studies",
    ],
    "2nd": [
      "Data Structures",
      "Algorithms",
      "Computer Networks",
      "Database Systems",
      "Software Engineering",
    ],
    "3rd": [
      "Operating Systems",
      "Database Management",
      "Computer Graphics",
      "Web Development",
      "Mobile App Development",
    ],
    "4th": [
      "Machine Learning",
      "Cloud Computing",
      "Artificial Intelligence",
      "Information Security",
      "Project Management",
    ],
  },
  "Electronics And TeleCommunication Engineering": {
    "1st": [
      "Basic Electronics",
      "Mathematics I",
      "Physics",
      "Chemistry",
      "Environmental Studies",
    ],
    "2nd": [
      "Signals and Systems",
      "Digital Electronics",
      "Circuit Theory",
      "Microprocessors",
      "Communication Principles",
    ],
    "3rd": [
      "Communication Systems",
      "Microprocessors",
      "Control Systems",
      "Digital Signal Processing",
      "Antenna Theory",
    ],
    "4th": [
      "VLSI Design",
      "Wireless Communication",
      "Optical Communication",
      "Embedded Systems",
      "Satellite Communication",
    ],
  },
  "Mechanical Engineering": {
    "1st": [
      "Engineering Mechanics",
      "Mathematics I",
      "Physics",
      "Chemistry",
      "Environmental Studies",
    ],
    "2nd": [
      "Thermodynamics",
      "Fluid Mechanics",
      "Manufacturing Processes",
      "Materials Science",
      "Machine Drawing",
    ],
    "3rd": [
      "Heat Transfer",
      "Machine Design",
      "CAD/CAM",
      "Industrial Engineering",
      "Metrology",
    ],
    "4th": [
      "Robotics",
      "Power Plant Engineering",
      "Automobile Engineering",
      "Refrigeration",
      "Project Management",
    ],
  },
  "Civil Engineering": {
    "1st": [
      "Engineering Drawing",
      "Mathematics I",
      "Physics",
      "Chemistry",
      "Environmental Studies",
    ],
    "2nd": [
      "Structural Mechanics",
      "Fluid Mechanics",
      "Surveying",
      "Building Materials",
      "Geology",
    ],
    "3rd": [
      "Design of Structures",
      "Geotechnical Engineering",
      "Transportation Engineering",
      "Water Resources",
      "Environmental Engineering",
    ],
    "4th": [
      "Construction Management",
      "Advanced Structures",
      "Urban Planning",
      "Earthquake Engineering",
      "Project Management",
    ],
  },
  "Electrical Engineering": {
    "1st": [
      "Basic Electrical",
      "Mathematics I",
      "Physics",
      "Chemistry",
      "Environmental Studies",
    ],
    "2nd": [
      "Circuit Theory",
      "Electromagnetic Fields",
      "Electrical Measurements",
      "Power Systems",
      "Control Systems",
    ],
    "3rd": [
      "Power Electronics",
      "Electrical Machines",
      "Digital Signal Processing",
      "Microprocessors",
      "Renewable Energy",
    ],
    "4th": [
      "High Voltage Engineering",
      "Power System Protection",
      "Electric Drives",
      "Smart Grid",
      "Energy Management",
    ],
  },
  "Instrumentation Engineering": {
    "1st": [
      "Basic Instrumentation",
      "Mathematics I",
      "Physics",
      "Chemistry",
      "Environmental Studies",
    ],
    "2nd": [
      "Transducers",
      "Signal Conditioning",
      "Control Systems",
      "Digital Electronics",
      "Process Control",
    ],
    "3rd": [
      "Industrial Instrumentation",
      "Microprocessors",
      "Digital Signal Processing",
      "Biomedical Instrumentation",
      "Analytical Instrumentation",
    ],
    "4th": [
      "Advanced Control Systems",
      "VLSI Design",
      "Robotics",
      "IoT Systems",
      "Automation",
    ],
  },
};

const splitYearSubjectsBySemester = (subjects = []) => {
  const midpoint = Math.ceil(subjects.length / 2);
  return {
    1: subjects.slice(0, midpoint),
    2: subjects.slice(midpoint),
  };
};

export const DEFAULT_SUBJECT_SETS = Object.fromEntries(
  Object.entries(LEGACY_DEFAULT_SUBJECT_SETS).map(([branch, yearsMap]) => {
    const semesterWiseYears = Object.fromEntries(
      Object.entries(yearsMap).map(([year, subjects]) => {
        return [year, splitYearSubjectsBySemester(subjects)];
      }),
    );

    return [branch, semesterWiseYears];
  }),
);

export const getSubjectsForBranchYearSemester = (
  subjectSets,
  branch,
  year,
  semester,
) => {
  return subjectSets?.[branch]?.[year]?.[semester] || [];
};

export const getSubjectsForBranchYear = (subjectSets, branch, year) => {
  const semMap = subjectSets?.[branch]?.[year] || {};
  const sem1 = semMap?.["1"] || [];
  const sem2 = semMap?.["2"] || [];
  return [...sem1, ...sem2];
};
