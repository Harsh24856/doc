import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* About Us Section */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">About Us</h3>
            <p className="text-sm leading-relaxed mb-4">
              DocSpace is the premier professional network for verified healthcare professionals. 
              We connect doctors, hospitals, and medical institutions to foster collaboration, 
              career growth, and better patient care.
            </p>
            <p className="text-sm leading-relaxed">
              Our mission is to create a secure, trusted platform where medical professionals 
              can network, find opportunities, and advance their careers.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/search/jobs" className="hover:text-[var(--color-primary)] transition">
                  Find Jobs
                </Link>
              </li>
              <li>
                <Link to="/get-verified" className="hover:text-[var(--color-primary)] transition">
                  Get Verified
                </Link>
              </li>
              <li>
                <Link to="/news" className="hover:text-[var(--color-primary)] transition">
                  News & Updates
                </Link>
              </li>
              <li>
                <Link to="/who" className="hover:text-[var(--color-primary)] transition">
                  Who Updates
                </Link>
              </li>
            </ul>
          </div>

          {/* For Hospitals */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">For Hospitals</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/post-job" className="hover:text-[var(--color-primary)] transition">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link to="/hospital-profile" className="hover:text-[var(--color-primary)] transition">
                  Hospital Profile
                </Link>
              </li>
              <li>
                <span className="hover:text-[var(--color-primary)] transition cursor-pointer">
                  Find Doctors
                </span>
              </li>
              <li>
                <span className="hover:text-[var(--color-primary)] transition cursor-pointer">
                  Verification Services
                </span>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="flex items-center gap-2">
                  <span>📧</span>
                  <span>Docspace2430@gmail.com</span>
                </span>
              </li>
              <li>
                <span className="flex items-center gap-2">
                  <span>📞</span>
                  <span>+1 (555) 123-4567</span>
                </span>
              </li>
              <li>
                <span className="flex items-center gap-2">
                  <span>📍</span>
                  <span>PEC, Chandigarh</span>
                </span>
              </li>
            </ul>
            <div className="mt-4 flex gap-4">
              <a href="#" className="text-gray-400 hover:text-[var(--color-primary)] transition">
                <span className="text-xl">📘</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-[var(--color-primary)] transition">
                <span className="text-xl">🐦</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-[var(--color-primary)] transition">
                <span className="text-xl">💼</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm">
            <span className="text-2xl font-bold text-[var(--color-primary)]">DocSpace</span>
            <span className="ml-2">🩺</span>
          </div>
          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()} DocSpace. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="#" className="hover:text-[var(--color-primary)] transition">
              Privacy Policy
            </Link>
            <Link to="#" className="hover:text-[var(--color-primary)] transition">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

