import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

function WaterEffect() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width = window.innerWidth;
    let height = canvas.parentElement.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    let ripples = [];

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (let ripple of ripples) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(0,255,255,${ripple.alpha})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = "rgba(0,255,255,0.7)";
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
        ripple.radius += 1.2;
        ripple.alpha -= 0.011;
      }
      ripples = ripples.filter((r) => r.alpha > 0);
      requestAnimationFrame(draw);
    }

    draw();

    function handleMove(e) {
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const y = e.touches
        ? e.touches[0].clientY - canvas.getBoundingClientRect().top
        : e.clientY - canvas.getBoundingClientRect().top;
      ripples.push({ x, y, radius: 0, alpha: 0.35 });
    }

    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("touchmove", handleMove);

    function handleResize() {
      width = window.innerWidth;
      height = canvas.parentElement.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    }
    window.addEventListener("resize", handleResize);

    return () => {
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("touchmove", handleMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute top-0 left-0 w-full h-full z-0"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

function Home() {
  const lenisRef = useRef(null);

  useEffect(() => {
    // Initialize Lenis for smooth scrolling
    lenisRef.current = new Lenis({
      duration: 1.2,
      smooth: true,
      direction: "vertical",
      gestureDirection: "vertical",
      smoothTouch: false,
      touchMultiplier: 2,
    });

    // Sync ScrollTrigger with Lenis
    lenisRef.current.on("scroll", ScrollTrigger.update);

    function raf(time) {
      lenisRef.current.raf(time);
      ScrollTrigger.update();
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // GSAP reveal animation for .reveal elements with reverse effect
    gsap.utils.toArray(".reveal").forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 64 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          delay: el.classList.contains("delay-100")
            ? 0.1
            : el.classList.contains("delay-200")
            ? 0.2
            : el.classList.contains("delay-300")
            ? 0.3
            : el.classList.contains("delay-400")
            ? 0.4
            : 0,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play reverse play reverse", // animate in and out
          },
        }
      );
    });

    return () => {
      if (lenisRef.current) lenisRef.current.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <main>
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
        <div className="flex flex-col justify-center items-center h-full text-white text-center px-4">
          <h1 className="text-6xl font-extrabold mb-4">CampusConnect</h1>
          <p className="text-xl font-light">
            Connecting Students, Building Communities
          </p>
        </div>
      </section>

      {/* Features Overview Section */}
      <section className="relative h-screen w-full bg-black text-white flex flex-col items-center justify-center px-4">
        <WaterEffect />
        <h2 className="text-4xl font-bold mb-8 text-center reveal transition-all duration-700 opacity-0 translate-y-8">
          CampusConnect Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
          {/* Announcements */}
          <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center text-center shadow hover:shadow-lg transition reveal delay-100">
            <div className="text-4xl mb-3">📢</div>
            <h3 className="text-xl font-semibold mb-2 text-blue-400">
              Announcements
            </h3>
            <p className="text-gray-300 mb-2">
              Stay updated with the latest campus news, events, and important
              notifications. Never miss an update from your institution!
            </p>
          </div>
          {/* Discussions */}
          <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center text-center shadow hover:shadow-lg transition reveal delay-200">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-xl font-semibold mb-2 text-green-400">
              Discussions
            </h3>
            <p className="text-gray-300 mb-2">
              Engage in real-time discussions, ask questions, and collaborate
              with peers and teachers on any topic.
            </p>
          </div>
          {/* Chat */}
          <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center text-center shadow hover:shadow-lg transition reveal delay-400">
            <div className="text-4xl mb-3">💻</div>
            <h3 className="text-xl font-semibold mb-2 text-purple-300">Chat</h3>
            <p className="text-gray-300 mb-2">
              Instantly connect and communicate with your classmates and
              teachers for seamless collaboration.
            </p>
          </div>
        </div>
      </section>

      {/* Page 2 - More about CampusConnect */}
      <section className="relative h-screen w-full bg-black text-white flex items-center justify-center">
        <WaterEffect />
        <div className="max-w-3xl text-center px-4 reveal">
          <h2 className="text-3xl font-bold mb-6 text-blue-400">
            Why Choose CampusConnect?
          </h2>
          <p className="mb-6 text-lg text-gray-200">
            CampusConnect is designed to make your campus life easier, more
            connected, and more productive. Whether you are a student, teacher,
            or administrator, our platform brings everyone together.
          </p>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div>
              <h3 className="text-xl font-semibold mb-2 text-green-400">
                🔒 Secure & Reliable
              </h3>
              <p className="mb-4 text-gray-300">
                Your data is protected with industry-standard security. Access
                your resources anytime, anywhere.
              </p>
              <h3 className="text-xl font-semibold mb-2 text-yellow-300">
                ⚡ Fast & Responsive
              </h3>
              <p className="mb-4 text-gray-300">
                Enjoy a seamless experience on any device, with instant
                notifications and real-time updates.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-purple-300">
                🤝 Community Driven
              </h3>
              <p className="mb-4 text-gray-300">
                Built for students and teachers, by students and teachers. Your
                feedback shapes our platform.
              </p>
              <h3 className="text-xl font-semibold mb-2 text-pink-400">
                🌟 All-in-One Solution
              </h3>
              <p className="mb-4 text-gray-300">
                Announcements, discussions, and chat—all in one place for a
                truly connected campus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Page 3 - In-depth Feature Details */}
      <section className="relative h-screen w-full bg-black text-white flex flex-col items-center justify-center px-4">
        <WaterEffect />
        <div className="max-w-5xl w-full reveal">
          <h2 className="text-3xl font-bold mb-8 text-center text-cyan-400">
            Deep Dive Into CampusConnect Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-4 reveal delay-100">
              <h3 className="text-2xl font-semibold text-blue-400 mb-2 flex items-center">
                <span className="text-3xl mr-2">📢</span> Announcements
              </h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>
                  Receive real-time updates about campus events, deadlines, and
                  news.
                </li>
                <li>
                  Personalized notifications so you never miss what matters to
                  you.
                </li>
                <li>Centralized dashboard for all important information.</li>
              </ul>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-4 reveal delay-200">
              <h3 className="text-2xl font-semibold text-green-400 mb-2 flex items-center">
                <span className="text-3xl mr-2">💬</span> Discussions
              </h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Participate in topic-based forums and Q&A sessions.</li>
                <li>Collaborate with classmates and teachers in real time.</li>
                <li>Get help, share ideas, and build your campus network.</li>
              </ul>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-4 reveal delay-400">
              <h3 className="text-2xl font-semibold text-purple-300 mb-2 flex items-center">
                <span className="text-3xl mr-2">💻</span> Chat
              </h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>
                  Instant messaging with classmates, teachers, and groups.
                </li>
                <li>Share files, links, and updates directly in chat.</li>
                <li>Stay connected on any device, anytime.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Page 4 with Black Gradient Footer */}
      <section className="relative min-h-screen w-full bg-black text-white flex flex-col justify-center items-center">
        <WaterEffect />
        <div className="flex flex-col items-center mb-12 reveal">
          <h2 className="text-4xl font-bold mb-4 text-purple-300">
            What’s Next for CampusConnect?
          </h2>
          <p className="mb-6 text-lg text-gray-200 max-w-2xl text-center">
            We are constantly working to bring you more features: mobile apps,
            advanced analytics, event management, and more! Stay tuned and be
            part of our journey to make campus life smarter and more connected.
          </p>
        </div>
        {/* Beautiful Black Gradient Footer */}
        <footer className="w-full bg-gradient-to-r from-black via-gray-900 to-gray-800 text-white py-16 px-6 mt-auto shadow-2xl reveal delay-200">
          <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-6 text-sm">
            <div>
              <h2 className="text-lg font-bold mb-2">CampusConnect</h2>
              <p>
                Empowering students with tools to collaborate, connect, and
                grow.
              </p>
            </div>
            <div>
              <h2 className="font-semibold mb-2">Explore</h2>
              <ul>
                <li>
                  <a href="#" className="hover:underline">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Features
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="font-semibold mb-2">Community</h2>
              <ul>
                <li>
                  <a href="#" className="hover:underline">
                    Discussions
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Announcements
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="font-semibold mb-2">Connect</h2>
              <ul>
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
          <div className="mt-10 text-center text-xs opacity-80">
            © {new Date().getFullYear()} CampusConnect. All rights reserved.
          </div>
        </footer>
      </section>
    </main>
  );
}

export default Home;
