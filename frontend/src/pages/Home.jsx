import AnnouncementsBanner from "../components/AnnouncementsBanner";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";

function Home() {
  const [user] = useAuthState(auth);

  return (
    <main>
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

        <div className="flex flex-col justify-center items-center h-full text-white text-center px-4">
          <h1 className="text-6xl font-extrabold mb-4">CampusConnect</h1>
          <p className="text-xl font-light">
            Connecting Students, Building Communities
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            Why Choose CampusConnect?
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg
                  className="w-7 h-7 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-3 text-gray-800">
                Real-time Updates
              </h3>
              <p className="text-gray-600 text-center">
                Stay informed with instant notifications about campus events,
                deadlines, and important announcements.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg
                  className="w-7 h-7 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-3 text-gray-800">
                Connected Community
              </h3>
              <p className="text-gray-600 text-center">
                Build meaningful connections with students, teachers, and staff
                across your entire campus.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg
                  className="w-7 h-7 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-3 text-gray-800">
                Academic Resources
              </h3>
              <p className="text-gray-600 text-center">
                Access course materials, discussion forums, and academic
                resources all in one unified platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-indigo-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">
            What Students Say
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden border-4 border-indigo-100"></div>
              </div>
              <p className="text-gray-600 mb-4 text-center">
                "CampusConnect has completely changed how I stay updated with
                events. No more missing important deadlines!"
              </p>
              <p className="text-center font-medium">
                - Sarah P., Computer Science
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden border-4 border-indigo-100"></div>
              </div>
              <p className="text-gray-600 mb-4 text-center">
                "As a club leader, I can now reach every student on campus with
                our event announcements. Engagement has doubled!"
              </p>
              <p className="text-center font-medium">
                - Michael K., Business Administration
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden border-4 border-indigo-100"></div>
              </div>
              <p className="text-gray-600 mb-4 text-center">
                "The discussion forums have helped me connect with seniors who
                guide me through difficult courses."
              </p>
              <p className="text-center font-medium">- Priya M., Engineering</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Campus Experience?
          </h2>
          <p className="text-lg mb-8 text-blue-100">
            Join thousands of students already using CampusConnect to stay
            connected.
          </p>
          <button className="bg-white text-indigo-600 font-semibold py-3 px-8 rounded-lg hover:bg-blue-50 transition-colors">
            Get Started Now
          </button>
        </div>
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
