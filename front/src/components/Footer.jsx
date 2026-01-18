import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 group w-fit">
              <span className="text-2xl font-bold text-white tracking-tight group-hover:text-[var(--color-primary)] transition-colors">DocSpace</span>
              <span className="text-2xl">🩺</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              The premier professional network for verified healthcare professionals. Connect, collaborate, and grow your medical career.
            </p>
            <div className="flex gap-4 pt-2">
              <SocialLink icon="📘" href="#" />
              <SocialLink icon="🐦" href="#" />
              <SocialLink icon="💼" href="#" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Platform</h3>
            <ul className="space-y-3 text-sm">
              <FooterLink to="/search/jobs">Find Jobs</FooterLink>
              <FooterLink to="/find-doctor">Find Doctors</FooterLink>
              <FooterLink to="/get-verified">Get Verified</FooterLink>
              <FooterLink to="/news">Medical News</FooterLink>
            </ul>
          </div>

          {/* For Hospitals */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Hospitals</h3>
            <ul className="space-y-3 text-sm">
              <FooterLink to="/post-job">Post a Job</FooterLink>
              <FooterLink to="/hospital-profile">Hospital Profile</FooterLink>
              <FooterLink to="/who">WHO Updates</FooterLink>
              <li className="text-gray-500 cursor-not-allowed">Talent Solutions</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">mail</span>
                <span>contact@docspace.com</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">call</span>
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[18px] mt-0.5">location_on</span>
                <span>PEC, Chandigarh</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© {year} DocSpace. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="#" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link to={to} className="hover:text-[var(--color-primary)] transition-colors duration-200 block w-fit">
        {children}
      </Link>
    </li>
  );
}

function SocialLink({ icon, href }) {
  return (
    <a
      href={href}
      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:bg-[var(--color-primary)] hover:text-white transition-all duration-200"
    >
      <span className="text-sm">{icon}</span>
    </a>
  );
}
