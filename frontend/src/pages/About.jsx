import React, { useEffect, useRef } from "react";
import Footer from "../components/Footer";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";

import about_img from "../assets/building.jpg";
import designstudents from "../assets/designstudents.jpg";
import connected_experience from "../assets/connected_experience.jpg";
import instant_updates from "../assets/instant_updates.jpg";
import feedback from "../assets/feedback.jpg";

gsap.registerPlugin(ScrollTrigger);

function About() {
  const sectionRefs = useRef([]);
  const cardRefs = useRef([]);
  const whyRef = useRef(null);
  const storyRef = useRef(null);
  const visionRef = useRef(null);

  useEffect(() => {
    // Animate sections
    sectionRefs.current.forEach((section) => {
      gsap.fromTo(
        section,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            end: "top 30%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    cardRefs.current.forEach((card, index) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
            end: "top 60%",
            scrub: true,
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    gsap.fromTo(
      whyRef.current,
      { opacity: 1 },
      {
        opacity: 1, // Keep it fully visible
        duration: 1,
        scrollTrigger: {
          trigger: whyRef.current,
          start: "top 50%",
          end: "top 20%",
          scrub: true,
          onUpdate: () => {
            whyRef.current.style.fontWeight = "bold"; // Ensure it stays bold
          },
        },
      }
    );

    gsap.fromTo(
      storyRef.current,
      { opacity: 0, x: -100 },
      {
        opacity: 1,
        x: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: storyRef.current,
          start: "top 80%",
          end: "top 50%",
          scrub: true,
        },
      }
    );

    gsap.fromTo(
      visionRef.current,
      { opacity: 0, x: 100 },
      {
        opacity: 1,
        x: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: visionRef.current,
          start: "top 90%",
          end: "top 70%",
          scrub: true,
          toggleActions: "play none none reverse",
        },
      }
    );
  }, []);

  return (
    <div className="bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section with Image */}
      <div className="relative h-[70vh] overflow-hidden">
        {/* Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src={about_img}
            alt="Campus Building"
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-white"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-white px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="mb-6"
            >
              <span className="inline-block px-6 py-3 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold border border-white/30">
                🎓 Learn More About Us
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
            >
              About CampusConnect
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-xl md:text-2xl font-light max-w-3xl mx-auto text-gray-100"
            >
              Empowering students to connect, collaborate, and thrive together
            </motion.p>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-white text-center"
          >
            <div className="text-sm mb-2">Scroll Down</div>
            <div className="w-6 h-10 border-2 border-white rounded-full mx-auto flex justify-center">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-white rounded-full mt-2"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* About Us Section */}
      <section
        className="py-24 px-6 relative overflow-hidden"
        ref={(el) => (sectionRefs.current[0] = el)}
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200 rounded-full filter blur-3xl opacity-20"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-semibold mb-6">
              ✨ Our Journey
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-800">
              About{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CampusConnect
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
              CampusConnect was envisioned in 2025 as a simple idea—to create a
              digital space that connects every student, club, and event in a
              single college community. What started as a basic project to
              simplify communication has now evolved into a platform aimed at
              transforming student life.
            </p>
            <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl border border-gray-100">
              <p className="text-lg text-gray-700 leading-relaxed">
                From announcements and events to resources and real-time
                discussions, CampusConnect makes it all accessible in one place.
                Whether you're a fresher or final-year student, it helps you
                stay connected, informed, and involved.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How We're Changing Campus Life */}
      <section
        className="bg-gradient-to-b from-gray-50 to-white py-24 px-6"
        ref={(el) => (sectionRefs.current[1] = el)}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
              How We're Changing{" "}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Campus Life
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Making student life simpler, smarter, and more connected
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              whileHover={{ y: -10 }}
              className="relative"
              ref={(el) => (cardRefs.current[0] = el)}
            >
              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden group border border-gray-100">
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                {/* Floating Image */}
                <div className="w-28 h-28 mb-6 rounded-2xl overflow-hidden shadow-xl -mt-16 relative z-10 ring-4 ring-white transform group-hover:scale-110 transition-transform duration-300">
                  <img
                    src={designstudents}
                    alt="Design for Students"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="relative z-10">
                  <div className="text-4xl mb-3">🎓</div>
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    Designed for Students
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed">
                    Built specifically to simplify and improve the everyday
                    lives of college students and campus communities.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -10 }}
              className="relative"
              ref={(el) => (cardRefs.current[1] = el)}
            >
              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden group border border-gray-100">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="w-28 h-28 mb-6 rounded-2xl overflow-hidden shadow-xl -mt-16 relative z-10 ring-4 ring-white transform group-hover:scale-110 transition-transform duration-300">
                  <img
                    src={connected_experience}
                    alt="Connected Experience"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="relative z-10">
                  <div className="text-4xl mb-3">🔗</div>
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    Connected Experience
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed">
                    Focused on building a seamless and more organized digital
                    campus with real-time collaboration.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -10 }}
              className="relative"
              ref={(el) => (cardRefs.current[2] = el)}
            >
              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden group border border-gray-100">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="w-28 h-28 mb-6 rounded-2xl overflow-hidden shadow-xl -mt-16 relative z-10 ring-4 ring-white transform group-hover:scale-110 transition-transform duration-300">
                  <img
                    src={instant_updates}
                    alt="Instant Updates"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="relative z-10">
                  <div className="text-4xl mb-3">📣</div>
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    Instant Updates
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed">
                    Never miss important announcements, events, or notices —
                    stay updated at all times.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -10 }}
              className="relative"
              ref={(el) => (cardRefs.current[3] = el)}
            >
              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden group border border-gray-100">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="w-28 h-28 mb-6 rounded-2xl overflow-hidden shadow-xl -mt-16 relative z-10 ring-4 ring-white transform group-hover:scale-110 transition-transform duration-300">
                  <img
                    src={feedback}
                    alt="Feedback"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="relative z-10">
                  <div className="text-4xl mb-3">🌱</div>
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    Constantly Evolving
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed">
                    We're actively developing and always open to feedback to
                    make CampusConnect even better.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why, Story, Vision Section */}
      <section
        className="py-24 px-6 bg-white relative overflow-hidden"
        ref={(el) => (sectionRefs.current[2] = el)}
      >
        <div className="max-w-6xl mx-auto space-y-20">
          {/* Why CampusConnect */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
            ref={whyRef}
          >
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6">
              <span className="text-blue-600 font-semibold">
                💡 Our Purpose
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
              Why{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CampusConnect
              </span>
              ?
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed max-w-4xl mx-auto">
              We're not just building a website — we're building a student
              ecosystem. CampusConnect is the bridge between students, clubs,
              events, and college life.
            </p>
          </motion.div>

          {/* Our Story & Vision - Side by Side */}
          <div className="grid md:grid-cols-2 gap-12">
            {/* Our Story */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
              ref={storyRef}
            >
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-10 border border-gray-100 h-full hover:shadow-xl transition-shadow">
                <div className="absolute -top-6 -left-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                  📖
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-bold mb-6 text-gray-800">
                    Our Story
                  </h3>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    Started by 4 students with a shared vision — we dreamed of a
                    cleaner, smarter way to stay connected on campus. What began
                    as a side project is now a growing platform that empowers
                    every student's journey.
                  </p>
                  <div className="mt-8 flex items-center gap-4">
                    <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                    <span className="text-sm text-gray-500 font-medium">
                      Since 2025
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Our Vision */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
              ref={visionRef}
            >
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-10 border border-gray-100 h-full hover:shadow-xl transition-shadow">
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                  🚀
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-bold mb-6 text-gray-800">
                    Our Vision
                  </h3>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    To create a centralized, interactive, and student-driven hub
                    for every college in the country. From real-time event
                    updates to simplified communications — CampusConnect is your
                    all-in-one campus companion.
                  </p>
                  <div className="mt-8 flex items-center gap-4 justify-end">
                    <span className="text-sm text-gray-500 font-medium">
                      Expanding Nationwide
                    </span>
                    <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default About;
