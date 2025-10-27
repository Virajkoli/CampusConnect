import AnnouncementsBanner from "../components/AnnouncementsBanner";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaBell,
  FaUsers,
  FaBookOpen,
  FaChartLine,
  FaCalendarAlt,
  FaComments,
  FaRocket,
  FaStar,
  FaCheckCircle,
  FaGraduationCap,
  FaLaptopCode,
  FaMobileAlt,
  FaShieldAlt,
} from "react-icons/fa";

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
        staggerChildren: 0.2,
      },
    },
  };

  const scaleIn = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <main className="overflow-x-hidden">
      {/* Display AnnouncementsBanner for logged in users */}
      {user && <AnnouncementsBanner />}

      {/* Hero Section with Video Background */}
      <section className="relative h-screen w-full overflow-hidden">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover z-[-1]"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70 z-0"></div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 flex flex-col justify-center items-center h-full text-white text-center px-4"
        >
          <motion.div variants={fadeInUp} className="mb-6">
            <span className="inline-block px-6 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-semibold border border-white/20">
              🎓 Welcome to the Future of Campus Life
            </span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-6xl md:text-8xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
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
            className="flex gap-4 flex-wrap justify-center"
          >
            {!user ? (
              <>
                <Link to="/student-auth">
                  <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300">
                    Get Started Free
                  </button>
                </Link>
                <button className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-bold py-4 px-8 rounded-full border-2 border-white/30 transform hover:scale-105 transition-all duration-300">
                  Watch Demo
                </button>
              </>
            ) : (
              <Link to="/student-dashboard">
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300">
                  Go to Dashboard
                </button>
              </Link>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-white via-blue-50 to-purple-50 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl opacity-10 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300 rounded-full filter blur-3xl opacity-10 translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-semibold mb-4">
              ✨ Powerful Features
            </span>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
              Everything You Need in
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                One Place
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Streamline your campus experience with our comprehensive suite of
              tools
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <FaBell className="w-8 h-8" />,
                title: "Instant Notifications",
                description:
                  "Never miss important announcements, deadlines, or campus events with real-time push notifications.",
                gradient: "from-blue-500 to-blue-600",
                bgGradient: "from-blue-50 to-blue-100",
              },
              {
                icon: <FaUsers className="w-8 h-8" />,
                title: "Connected Community",
                description:
                  "Build meaningful relationships with peers, mentors, and faculty across departments.",
                gradient: "from-green-500 to-emerald-600",
                bgGradient: "from-green-50 to-emerald-100",
              },
              {
                icon: <FaBookOpen className="w-8 h-8" />,
                title: "Study Materials",
                description:
                  "Access course materials, notes, and resources organized by subject and semester.",
                gradient: "from-purple-500 to-purple-600",
                bgGradient: "from-purple-50 to-purple-100",
              },
              {
                icon: <FaCalendarAlt className="w-8 h-8" />,
                title: "Smart Timetable",
                description:
                  "Interactive calendar with class schedules, exam dates, and personalized reminders.",
                gradient: "from-orange-500 to-orange-600",
                bgGradient: "from-orange-50 to-orange-100",
              },
              {
                icon: <FaComments className="w-8 h-8" />,
                title: "Discussion Forums",
                description:
                  "Engage in meaningful conversations, ask questions, and share knowledge with the community.",
                gradient: "from-pink-500 to-pink-600",
                bgGradient: "from-pink-50 to-pink-100",
              },
              {
                icon: <FaChartLine className="w-8 h-8" />,
                title: "Performance Analytics",
                description:
                  "Track your academic progress with detailed insights and personalized recommendations.",
                gradient: "from-indigo-500 to-indigo-600",
                bgGradient: "from-indigo-50 to-indigo-100",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className={`bg-gradient-to-br ${feature.bgGradient} p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group`}
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 text-white transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-800">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-20"
          >
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-semibold mb-4">
              🚀 Simple Process
            </span>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
              Get Started in{" "}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                3 Easy Steps
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-1/4 left-1/6 right-1/6 h-1 bg-gradient-to-r from-purple-200 via-pink-200 to-orange-200"></div>

            {[
              {
                step: "01",
                title: "Create Account",
                description:
                  "Sign up with your college email and verify your identity in seconds",
                icon: <FaRocket />,
                color: "purple",
              },
              {
                step: "02",
                title: "Complete Profile",
                description:
                  "Add your details, interests, and academic information to personalize your experience",
                icon: <FaGraduationCap />,
                color: "pink",
              },
              {
                step: "03",
                title: "Start Connecting",
                description:
                  "Join discussions, access materials, and stay updated with campus life",
                icon: <FaCheckCircle />,
                color: "orange",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { delay: index * 0.2, duration: 0.6 },
                  },
                }}
                className="relative"
              >
                <div
                  className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 flex items-center justify-center text-white text-3xl shadow-xl relative z-10`}
                >
                  {item.icon}
                </div>
                <div className="text-center">
                  <div
                    className={`text-6xl font-bold text-${item.color}-200 mb-2`}
                  >
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-semibold mb-4">
              ⭐ Success Stories
            </span>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
              Loved by{" "}
              <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                Thousands
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              See what our community members are saying
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                name: "Pallavi Patil",
                role: "Computer Science, Final Year",
                avatar: "👩‍💻",
                rating: 5,
                text: "CampusConnect transformed my college experience! The study materials feature helped me ace my exams, and I've made amazing connections through the discussion forums.",
                highlight: "98% grade improvement",
              },
              {
                name: "Rahul Brahmane",
                role: "Computer Science, Final Year",
                avatar: "👨‍💼",
                rating: 5,
                text: "As a club leader, reaching 3000+ students with event announcements was impossible before. Now our engagement has tripled! The announcement system is a game-changer.",
                highlight: "3x engagement boost",
              },
              {
                name: "Durgesh Patil",
                role: "Computer Science, Final Year",
                avatar: "👩‍🔬",
                rating: 5,
                text: "The timetable feature keeps me organized, and the real-time notifications ensure I never miss important deadlines. Plus, seniors mentoring through chat is invaluable!",
                highlight: "Zero missed deadlines",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full filter blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"></div>

                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-3xl mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FaStar key={i} className="text-yellow-400 w-5 h-5" />
                    ))}
                  </div>

                  <p className="text-gray-700 mb-4 leading-relaxed italic">
                    "{testimonial.text}"
                  </p>

                  <div className="inline-block px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full">
                    <span className="text-sm font-semibold text-orange-700">
                      💡 {testimonial.highlight}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
          <div
            className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-300 rounded-full filter blur-3xl opacity-10 animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16 text-white"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Why Choose CampusConnect?
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              We're more than just a platform - we're your complete campus
              companion
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <FaLaptopCode />,
                title: "Modern Tech",
                description:
                  "Built with cutting-edge technology for seamless performance",
              },
              {
                icon: <FaMobileAlt />,
                title: "Mobile First",
                description:
                  "Access everything on-the-go from any device, anywhere",
              },
              {
                icon: <FaShieldAlt />,
                title: "Secure & Private",
                description:
                  "Your data is protected with enterprise-grade security",
              },
              {
                icon: <FaRocket />,
                title: "Always Improving",
                description:
                  "Regular updates with new features based on your feedback",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center text-white"
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center text-4xl border border-white/30">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-blue-100">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-32 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full filter blur-3xl opacity-20"></div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="max-w-5xl mx-auto text-center px-6 relative z-10"
        >
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6">
            <span className="text-blue-600 font-semibold">
              🎉 Join 10,000+ Happy Students
            </span>
          </div>

          <h2 className="text-5xl md:text-7xl font-bold mb-6 text-gray-800">
            Ready to Transform Your
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Campus Experience?
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Join thousands of students already using CampusConnect to stay
            connected, organized, and ahead
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {!user ? (
              <>
                <Link to="/student-auth">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-5 px-12 rounded-full shadow-2xl text-lg"
                  >
                    Get Started Free →
                  </motion.button>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-purple-600 font-bold py-5 px-12 rounded-full shadow-lg border-2 border-purple-200 hover:border-purple-300 text-lg"
                >
                  Schedule Demo
                </motion.button>
              </>
            ) : (
              <Link to="/student-dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-5 px-12 rounded-full shadow-2xl text-lg"
                >
                  Go to Your Dashboard →
                </motion.button>
              </Link>
            )}
          </div>

          <div className="mt-12 flex justify-center items-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              <span>Free forever</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              <span>Setup in 2 minutes</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Better Footer */}
      <footer className="w-full bg-gradient-to-r from-gray-800 via-gray-900 to-indigo-900 text-white py-16 px-6 mt-auto">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              CampusConnect
            </h2>
            <p className="text-gray-300">
              Empowering students with tools to collaborate, connect, and grow
              together in a thriving campus community.
            </p>
          </div>
          <div>
            <h2 className="font-semibold mb-4 text-lg">Explore</h2>
            <ul className="space-y-2">
              <li>
                <a
                  href="/"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/features"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Features
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="font-semibold mb-4 text-lg">Community</h2>
            <ul className="space-y-2">
              <li>
                <a
                  href="/discussions"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Discussions
                </a>
              </li>
              <li>
                <a
                  href="/notes"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Notes
                </a>
              </li>
              <li>
                <a
                  href="/announcements"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Announcements
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="font-semibold mb-4 text-lg">Connect</h2>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="hover:underline flex items-center space-x-2"
                >
                  <i className="fab fa-linkedin"></i>
                  <span>LinkedIn</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:underline flex items-center space-x-2"
                >
                  <i className="fab fa-github"></i>
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:underline flex items-center space-x-2"
                >
                  <i className="fas fa-envelope"></i>
                  <span>Contact Us</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 text-center text-xs opacity-70">
          © {new Date().getFullYear()} CampusConnect. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

export default Home;
