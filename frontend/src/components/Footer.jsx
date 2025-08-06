import React from "react";
import { FaGithub, FaInstagram, FaLinkedin } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-10 mt-20">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">CampusConnect</h2>
          <p className="text-gray-400">Connecting Campus Life, Seamlessly.</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <a href="/" className="hover:text-white">
                Home
              </a>
            </li>
            <li>
              <a href="/about" className="hover:text-white">
                About
              </a>
            </li>
            

          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Features</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>Instant Updates</li>
            <li>Club Collaboration</li>
            <li>Notices & Announcements</li>
            <li>Discover Campus Life</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Follow Us</h3>
          <div className="flex space-x-4 text-xl text-gray-400">
            <a href="#" aria-label="GitHub">
              <FaGithub className="hover:text-white" />
            </a>
            <a href="#" aria-label="Instagram">
              <FaInstagram className="hover:text-white" />
            </a>
            <a href="#" aria-label="LinkedIn">
              <FaLinkedin className="hover:text-white" />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} CampusConnect. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
