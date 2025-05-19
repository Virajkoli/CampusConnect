import React, { useEffect, useRef } from "react";
import Footer from "../components/Footer";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
    <div>
      <div>
        <img
          src={about_img}
          alt="About"
          className="w-screen h-screen object-cover"
        />
      </div>

      <section
        className="bg-white py-20 max-w-3xl mx-auto px-6 text-center"
        ref={(el) => (sectionRefs.current[0] = el)}
      >
        <div className="max-w-3xl mx-auto text-center">
          <div>
            <h2 className="text-[2rem] font-semibold mb-6">About us</h2>
          </div>
          <p className="text-gray-700 text-[1rem] leading-[1.75]">
            CampusConnect was envisioned in 2025 as a simple idea—to create a
            digital space that connects every student, club, and event in a
            single college community. What started as a basic project to
            simplify communication has now evolved into a platform aimed at
            transforming student life. <br />
            From announcements and events to resources and real-time
            discussions, CampusConnect makes it all accessible in one place.
            Whether you're a fresher or final-year student, it helps you stay
            connected, informed, and involved.
          </p>
        </div>
      </section>

      <section
        className="bg-gray-100 px-6 py-20"
        ref={(el) => (sectionRefs.current[1] = el)}
      >
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">
            How We’re Changing Campus Life
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div
              className="bg-white rounded-2xl p-8 shadow hover:shadow-lg transition flex flex-col items-center text-center relative"
              ref={(el) => (cardRefs.current[0] = el)}
            >
              <div className="w-24 h-24 mb-0 rounded-full bg-gray-200 overflow-hidden -mt-12">
                <img
                  src={designstudents}
                  alt="Design for Students"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold mt-6 mb-4">
                🎓 Designed for Students
              </h3>
              <p className="text-gray-600 text-base">
                Built specifically to simplify and improve the everyday lives of
                college students and campus communities.
              </p>
            </div>

            <div
              className="bg-white rounded-2xl p-8 shadow hover:shadow-lg transition flex flex-col items-center text-center relative"
              ref={(el) => (cardRefs.current[1] = el)}
            >
              <div className="w-24 h-24 mb-0 rounded-full bg-gray-200 overflow-hidden -mt-12">
                <img
                  src={connected_experience}
                  alt="Connected Experience"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold mt-6 mb-4">
                🔗 Connected Experience
              </h3>
              <p className="text-gray-600 text-base">
                Focused on building a seamless and more organized digital campus
                with real-time collaboration.
              </p>
            </div>

            <div
              className="bg-white rounded-2xl p-8 shadow hover:shadow-lg transition flex flex-col items-center text-center relative"
              ref={(el) => (cardRefs.current[2] = el)}
            >
              <div className="w-24 h-24 mb-0 rounded-full bg-gray-200 overflow-hidden -mt-12">
                <img
                  src={instant_updates}
                  alt="Instant Updates"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold mt-6 mb-4">
                📣 Instant Updates
              </h3>
              <p className="text-gray-600 text-base">
                Never miss important announcements, events, or notices — stay
                updated at all times.
              </p>
            </div>

            <div
              className="bg-white rounded-2xl p-8 shadow hover:shadow-lg transition flex flex-col items-center text-center relative"
              ref={(el) => (cardRefs.current[3] = el)}
            >
              <div className="w-24 h-24 mb-0 rounded-full bg-gray-200 overflow-hidden -mt-12">
                <img
                  src={feedback}
                  alt="Feedback"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold mt-6 mb-4">
                🌱 Constantly Evolving
              </h3>
              <p className="text-gray-600 text-base">
                We’re actively developing and always open to feedback to make
                CampusConnect even better.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="max-w-5xl mx-auto px-6 py-16 text-center space-y-12"
        ref={(el) => (sectionRefs.current[2] = el)}
      >
        <div className="space-y-4" ref={whyRef}>
          <h1 className="text-4xl font-bold tracking-wide">
            Why CampusConnect?
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            We’re not just building a website — we’re building a student
            ecosystem. CampusConnect is the bridge between students, clubs,
            events, and college life.
          </p>
        </div>

        <div className="space-y-4" ref={storyRef}>
          <h2 className="text-3xl font-semibold text-left">Our Story</h2>
          <p className="text-base text-gray-600 text-left">
            Started by 4 students with a shared vision — we dreamed of a
            cleaner, smarter way to stay connected on campus. What began as a
            side project is now a growing platform that empowers every student’s
            journey.
          </p>
        </div>

        <div className="space-y-4" ref={visionRef}>
          <h2 className="text-3xl font-semibold text-right">Our Vision</h2>
          <p className="text-base text-gray-600 text-right">
            To create a centralized, interactive, and student-driven hub for
            every college in the country. From real-time event updates to
            simplified communications — CampusConnect is your all-in-one campus
            companion.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default About;
