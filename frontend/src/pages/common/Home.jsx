import AnnouncementsBanner from "../../components/common/AnnouncementsBanner";
import Footer from "../../components/common/Footer";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarClock,
  CalendarRange,
  ChartColumnBig,
  CheckCircle2,
  Fingerprint,
  LayoutDashboard,
  MessageSquare,
  QrCode,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

function Home() {
  const [user] = useAuthState(auth);

  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const featureTiles = [
    {
      icon: LayoutDashboard,
      title: "Role-Based Dashboards",
      description:
        "Student, teacher, and admin workflows in one consistent interface.",
      accent: "from-[#125c7f] to-[#1d8cbf]",
      bg: "from-[#e8f6ff] to-[#f6fbff]",
    },
    {
      icon: Bell,
      title: "Announcements + Alerts",
      description:
        "Real-time communication that keeps everyone synced and informed.",
      accent: "from-[#c95f2f] to-[#ef7f4f]",
      bg: "from-[#fff1e8] to-[#fff8f3]",
    },
    {
      icon: CalendarRange,
      title: "Academic Calendar",
      description:
        "Institution events, holidays, and timelines in a clean visual view.",
      accent: "from-[#2f7a4f] to-[#43a16a]",
      bg: "from-[#e9f9ef] to-[#f5fdf8]",
    },
    {
      icon: CalendarClock,
      title: "Exam Timetable Engine",
      description:
        "Year-wise scheduling with branch-aware mapping and preview validation.",
      accent: "from-[#6244b8] to-[#7a5bd1]",
      bg: "from-[#f1edff] to-[#f8f5ff]",
    },
    {
      icon: ScanFace,
      title: "Face Attendance",
      description:
        "AI-assisted identity checks for secure and fast attendance capture.",
      accent: "from-[#1f6d78] to-[#2a93a1]",
      bg: "from-[#e6f8fa] to-[#f2fcfd]",
    },
    {
      icon: QrCode,
      title: "QR Attendance",
      description:
        "Scan-based class marking for low-friction attendance operations.",
      accent: "from-[#8c5a12] to-[#b27919]",
      bg: "from-[#fff6e7] to-[#fffbf2]",
    },
    {
      icon: Fingerprint,
      title: "Biometric Verification",
      description: "Additional integrity layer for attendance confidence.",
      accent: "from-[#7a3b4d] to-[#a44f68]",
      bg: "from-[#fff0f5] to-[#fff7fa]",
    },
    {
      icon: BookOpen,
      title: "Study Resources",
      description:
        "Subjects, notes, and materials with faster in-app discoverability.",
      accent: "from-[#3366a0] to-[#4f84c5]",
      bg: "from-[#ecf4ff] to-[#f7faff]",
    },
    {
      icon: MessageSquare,
      title: "Campus Chat",
      description:
        "Direct communication between students, teachers, and communities.",
      accent: "from-[#355f56] to-[#4a8678]",
      bg: "from-[#ebf7f3] to-[#f6fcfa]",
    },
    {
      icon: ChartColumnBig,
      title: "Analytics + Insights",
      description:
        "Attendance trends and data-backed decision support for faculty.",
      accent: "from-[#7a4a1b] to-[#a56627]",
      bg: "from-[#fff2e8] to-[#fff9f4]",
    },
    {
      icon: ShieldCheck,
      title: "Protected Access",
      description: "Route guards and role validation across the platform.",
      accent: "from-[#2c5f76] to-[#3f85a5]",
      bg: "from-[#ebf8ff] to-[#f6fcff]",
    },
    {
      icon: Users,
      title: "Unified Campus Layer",
      description:
        "Designed to keep departments, batches, and stakeholders aligned.",
      accent: "from-[#55426f] to-[#755a97]",
      bg: "from-[#f2edfb] to-[#faf7ff]",
    },
  ];

  const team = [
    {
      name: "Viraj Koli",
      role: "Architecture + Platform Logic",
      focus: "Release stability, testing strategy, and deployment quality.",
      aura: "from-[#eadfff] via-[#f5f1ff] to-[#fbf9ff]",
      ring: "#9a82d8",
    },
    {
      name: "Pallavi Patil",
      role: "Frontend + Product Experience",
      focus: "Design systems, UX choreography, and student-facing flows.",
      aura: "from-[#ffdbcb] via-[#fff3ed] to-[#f8fbff]",
      ring: "#f59f79",
    },
    {
      name: "Rahul Brahmane",
      role: "Backend + Attendance Intelligence",
      focus: "Face-recognition pipelines, automation, and real-time services.",
      aura: "from-[#d4f3ff] via-[#edfaff] to-[#f7fcff]",
      ring: "#66b7d4",
    },
    {
      name: "Durgesh Patil",
      role: "User flow + Platform Reliability",
      focus: "Face-recognition pipelines and high-confidence verification.",
      aura: "from-[#ddeed9] via-[#f2fbf0] to-[#f9fdf8]",
      ring: "#7ead75",
    },
  ];

  return (
    <main className="overflow-x-hidden bg-[#f6f7fb] text-slate-800">
      {user && <AnnouncementsBanner />}

      {/* Hero section with modernized controls */}
      <section className="relative h-screen w-full overflow-hidden bg-black">
        <video
          className="absolute inset-0 h-full w-full object-cover z-0"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="/video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/50 via-black/30 to-black/70"></div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-20 flex h-full flex-col items-center justify-center px-4 text-center text-white"
        >
          <motion.div variants={fadeInUp} className="mb-6">
            <span className="inline-block px-6 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-semibold border border-white/20">
              🎓 Welcome to the Future of Campus Life
            </span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-6xl md:text-8xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
          >
            CampusConnect
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-xl md:text-2xl font-light mb-8 max-w-2xl text-gray-100"
          >
            Connecting Students, Empowering Communities, Building the Future
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
          >
            {!user ? (
              <>
                <Link to="/student-auth">
                  <button className="group inline-flex items-center gap-2 rounded-full border border-white/30 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_14px_40px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(0,0,0,0.34)] sm:px-8 sm:py-4 sm:text-base">
                    Get Started Free
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </Link>
                <button className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-[#0c1b2d]/30 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-[#0c1b2d]/45 sm:px-8 sm:py-4 sm:text-base">
                  Watch Demo
                </button>
              </>
            ) : (
              <Link to="/student-dashboard">
                <button className="group inline-flex items-center gap-2 rounded-full border border-white/30 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_14px_40px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(0,0,0,0.34)] sm:px-8 sm:py-4 sm:text-base">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </Link>
            )}
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="mt-7 grid w-full max-w-3xl grid-cols-1 gap-3 px-3 sm:grid-cols-3 sm:px-0"
          >
            {[
              { label: "Role Flows", value: "Student • Teacher • Admin" },
              { label: "Attendance", value: "Face • QR • Biometric" },
              { label: "Communication", value: "Realtime Alerts + Chat" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-left backdrop-blur-md"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {item.value}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <section className="relative isolate overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-[#9ec6ff]/35 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#ffd6b8]/35 blur-3xl" />

        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#9ab8d9] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1b5777]">
              <Sparkles className="h-3.5 w-3.5" />
              Platform Surface
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-800 sm:text-5xl">
              Campus Operations,
              <span className="block bg-gradient-to-r from-[#1d7098] via-[#3b86b1] to-[#c96d3f] bg-clip-text text-transparent">
                Beautifully Unified
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base text-slate-600 sm:text-lg">
              Every major feature of CampusConnect, presented as one integrated
              digital campus cockpit.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
          >
            {featureTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <motion.article
                  key={tile.title}
                  variants={fadeInUp}
                  whileHover={{ y: -6 }}
                  className={`group rounded-3xl border border-slate-200 bg-gradient-to-br ${tile.bg} p-5 shadow-sm transition-all duration-300 hover:shadow-xl`}
                >
                  <div
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tile.accent} text-white shadow-md`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800">
                    {tile.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {tile.description}
                  </p>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-10"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-[#e6f4ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#1a6589]">
              <CheckCircle2 className="h-4 w-4" />
              Why It Works
            </span>
            <h3 className="mt-4 text-3xl font-bold text-slate-800 sm:text-4xl">
              Purpose-built for campus velocity
            </h3>
            <p className="mt-3 text-slate-600">
              From attendance intelligence to exam planning and instant academic
              communication, CampusConnect compresses scattered systems into one
              high-clarity platform.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "Attendance by Face, QR, and biometric paths",
                "Exam + academic schedule managed year-wise",
                "Role-aware notifications and announcements",
                "Live communication layer for students and faculty",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-[#fbfcff] px-4 py-3 text-sm font-medium text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-[#0f4b67] via-[#1b6487] to-[#2f82ac] p-7 text-white shadow-sm sm:p-10"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
              <Sparkles className="h-4 w-4" />
              Ready to Launch
            </span>
            <h3 className="mt-4 text-3xl font-bold sm:text-4xl">
              Bring your campus online in one flow
            </h3>
            <p className="mt-3 text-sm text-white/90">
              Activate your account and move from fragmented processes to one
              coherent student-first ecosystem.
            </p>

            <div className="mt-7 space-y-3">
              {!user ? (
                <Link
                  to="/student-auth"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#0f4b67] transition hover:bg-[#f2f8ff]"
                >
                  Start With CampusConnect
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  to="/student-dashboard"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#0f4b67] transition hover:bg-[#f2f8ff]"
                >
                  Open Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

export default Home;
