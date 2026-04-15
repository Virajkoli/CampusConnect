import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Blocks,
  Bot,
  Compass,
  GraduationCap,
  LayoutPanelTop,
  Rocket,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "../../components/common/Footer";
import about_img from "../../assets/building.jpg";

const values = [
  {
    icon: Compass,
    title: "Student-Centered Decisions",
    description:
      "Every major flow starts with real student pain points and time-saving intent.",
  },
  {
    icon: Blocks,
    title: "Modular Platform Thinking",
    description:
      "Announcements, attendance, timetable, and analytics all work as one connected system.",
  },
  {
    icon: Shield,
    title: "Integrity + Trust",
    description:
      "Role-aware access and verification layers keep campus operations reliable.",
  },
  {
    icon: Rocket,
    title: "Rapid Iteration",
    description:
      "We ship, learn, and refine continuously from usage patterns and feedback loops.",
  },
];

const featureStories = [
  {
    tag: "Communication",
    title: "Announcements that actually reach everyone",
    detail:
      "From critical alerts to academic reminders, notifications are built for high visibility and low friction.",
  },
  {
    tag: "Academic Operations",
    title: "Calendar and exam flow, centrally managed",
    detail:
      "Year-wise scheduling and structured previews reduce admin overhead and confusion.",
  },
  {
    tag: "Attendance Intelligence",
    title: "Face, QR, and biometric-ready workflows",
    detail:
      "Flexible attendance paths designed for both classroom speed and record confidence.",
  },
  {
    tag: "Insights",
    title: "Data-backed visibility for teachers and admins",
    detail:
      "Attendance analytics and trend surfaces help teams take action earlier.",
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

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

function About() {
  return (
    <div className="bg-[#f6f7fb] text-slate-800">
      <section className="relative isolate h-[72vh] overflow-hidden">
        <img
          src={about_img}
          alt="Campus Building"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-[#f6f7fb]" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl text-white"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em]">
              <Sparkles className="h-3.5 w-3.5" />
              About CampusConnect
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-6xl">
              Building the digital spine
              <span className="block bg-gradient-to-r from-[#9fd5ff] via-[#d3b9ff] to-[#ffc3a6] bg-clip-text text-transparent">
                for student life
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/90 sm:text-lg">
              Started by four developers, CampusConnect turns scattered campus
              workflows into one elegant, dependable platform.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-10"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-[#ebf5ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#1f668c]">
              <GraduationCap className="h-4 w-4" />
              Our Mission
            </span>
            <h2 className="mt-4 text-3xl font-bold text-slate-800 sm:text-4xl">
              Simplify campus operations without losing human connection
            </h2>
            <p className="mt-4 text-slate-600">
              We are designing a platform where communication, attendance,
              scheduling, and academic planning feel coherent instead of
              fragmented. CampusConnect is focused on reducing admin fatigue and
              improving student clarity every day.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                "Unified admin-teacher-student experience",
                "Reliable reminders and communication loops",
                "Attendance integrity with modern verification",
                "Scalable architecture for campus growth",
              ].map((line) => (
                <div
                  key={line}
                  className="rounded-xl border border-slate-200 bg-[#fafcff] px-4 py-3 text-sm font-medium text-slate-700"
                >
                  {line}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-[#0f4e6b] via-[#1c6a8d] to-[#2e8cb6] p-7 text-white shadow-sm sm:p-10"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
              <LayoutPanelTop className="h-4 w-4" />
              Platform Snapshot
            </span>
            <div className="mt-5 space-y-3 text-sm text-white/95">
              <p>12+ major modules integrated under one product surface.</p>
              <p>
                Role-specific flows for admin, teacher, and student contexts.
              </p>
              <p>Real-time notifications and exam reminder support.</p>
              <p>Attendance stack powered by AI-first capabilities.</p>
            </div>
          </motion.aside>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f2f6ff] px-4 py-20 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -top-16 left-0 h-72 w-72 rounded-full bg-[#c8dcff]/45 blur-3xl" />

        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#b2c7ef] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#355c9d]">
              <Bot className="h-3.5 w-3.5" />
              What We Are Building
            </span>
            <h2 className="mt-4 text-4xl font-bold text-slate-800 sm:text-5xl">
              Design, intelligence, and workflow depth
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-5 md:grid-cols-2"
          >
            {featureStories.map((story) => (
              <motion.article
                key={story.title}
                variants={fadeInUp}
                whileHover={{ y: -6 }}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#3c6ca8]">
                  {story.tag}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-800">
                  {story.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {story.detail}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f2f6ff] px-4 py-20 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -top-16 right-0 h-64 w-64 rounded-full bg-[#ced8ff]/40 blur-3xl" />

        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#b6c8ef] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#3d5b9a]">
              <Users className="h-3.5 w-3.5" />
              Team Behind CampusConnect
            </span>
            <h2 className="mt-4 text-4xl font-bold text-slate-800 sm:text-5xl">
              Four minds, one campus-grade mission
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-slate-600">
              A compact developer squad blending product design, AI attendance,
              backend architecture, and release discipline.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
          >
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                className={`rounded-3xl border border-slate-200 bg-gradient-to-br ${member.aura} p-5 shadow-sm transition-all duration-300 hover:shadow-xl`}
              >
                <div
                  className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border bg-white text-sm font-bold"
                  style={{ borderColor: member.ring, color: member.ring }}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {member.role}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {member.focus}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto flex max-w-5xl flex-col items-center rounded-[2rem] border border-slate-200 bg-white px-6 py-10 text-center shadow-sm sm:px-10"
        >
          <h3 className="text-3xl font-bold text-slate-800 sm:text-4xl">
            Want to explore CampusConnect in action?
          </h3>
          <p className="mt-3 max-w-3xl text-slate-600">
            See how your campus can move from isolated tools to one beautiful,
            student-focused operating layer.
          </p>
          <Link
            to="/login"
            className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#145d80] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0f4a67]"
          >
            Start Exploring
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}

export default About;
