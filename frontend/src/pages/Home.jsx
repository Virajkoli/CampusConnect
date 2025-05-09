function Home() {
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

      {/* Black Pages */}
      {[1, 2, 3].map((n) => (
        <section
          key={n}
          className="h-screen w-full bg-black text-white flex items-center justify-center"
        >
          <p className="text-2xl">Page {n}</p>
        </section>
      ))}

      {/* Page 4 with Footer */}
      <section className="min-h-screen w-full bg-black text-white flex flex-col justify-center items-center">
        <p className="text-2xl mb-8">Page 4</p>

        {/* Extraordinary Footer */}
        <footer className="w-full bg-gradient-to-r from-black via-gray-800 to-gray-900 text-white py-16 px-6 mt-auto">
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
                    Notes
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
          <div className="mt-10 text-center text-xs opacity-70">
            © {new Date().getFullYear()} CampusConnect. All rights reserved.
          </div>
        </footer>
      </section>
    </main>
  );
}

export default Home;
