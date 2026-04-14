import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowRight, FiBookOpen, FiShield, FiUsers } from "react-icons/fi";

export default function AuthPage() {
  const navigate = useNavigate();

  const roles = [
    {
      id: "student",
      title: "Student",
      description: "Join classes, mark attendance, and track your progress.",
      icon: FiBookOpen,
      accent: "from-[#2f87d9] to-[#59a2e8]",
      softBg: "bg-[#e9f2ff]",
      target: "/auth/student",
    },
    {
      id: "teacher",
      title: "Teacher",
      description: "Run attendance sessions and manage classroom insights.",
      icon: FiUsers,
      accent: "from-[#14967f] to-[#32b69d]",
      softBg: "bg-[#e7faf6]",
      target: "/auth/teacher",
    },
    {
      id: "admin",
      title: "Admin",
      description: "Control campus users, subjects, and platform settings.",
      icon: FiShield,
      accent: "from-[#f97316] to-[#fb923c]",
      softBg: "bg-[#fff2e9]",
      target: "/auth/admin",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef2f6] px-4 pb-8 pt-24 sm:px-6">
      <div className="pointer-events-none absolute -left-24 -top-16 h-64 w-64 rounded-full bg-[#b7dcff] blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-[#d7f2e6] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-[#ffe1cc] blur-3xl" />

      <motion.div
        className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-xl"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-12 lg:p-8">
          <div className="rounded-3xl bg-[#f8fbff] p-6 lg:col-span-5 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f87d9]">
              CampusConnect Auth
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
              Choose Your Role
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
              Continue with your role-specific workspace for attendance,
              analytics, and campus operations.
            </p>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tip
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Use your dedicated role login. Teacher and Admin claims are
                validated after authentication.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#2f87d9]"
            >
              Back to Home <FiArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:col-span-7 sm:grid-cols-2 lg:grid-cols-1">
            {roles.map((role, index) => {
              const Icon = role.icon;
              return (
                <motion.button
                  key={role.id}
                  type="button"
                  onClick={() => navigate(role.target)}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md sm:p-5"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.08, duration: 0.35 }}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${role.softBg}`}
                      >
                        <Icon className="h-5 w-5 text-slate-700" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          {role.title}
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                          {role.description}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`h-9 w-9 rounded-full bg-gradient-to-br ${role.accent} p-[1px]`}
                    >
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
                        <FiArrowRight className="h-4 w-4 text-slate-700 transition group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-center text-xs text-slate-500 lg:px-8">
          © {new Date().getFullYear()} CampusConnect
        </div>
      </motion.div>
    </div>
  );
}
