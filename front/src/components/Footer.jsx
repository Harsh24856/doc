import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="text-2xl font-bold text-[var(--color-primary)] flex items-center gap-2 mb-4">
              DocSpace 🩺
            </Link>
            <p className="text-gray-500 leading-relaxed">
              The trusted professional network for doctors and healthcare providers worldwide.
            </p>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6">Company</h4>
            <ul className="space-y-4 text-gray-600">
              <li><Link to="/" className="hover:text-[var(--color-primary)] transition">Home</Link></li>
              <li><Link to="/about" className="hover:text-[var(--color-primary)] transition">About Us</Link></li>
              <li><Link to="/careers" className="hover:text-[var(--color-primary)] transition">Careers</Link></li>
              <li><Link to="/contact" className="hover:text-[var(--color-primary)] transition">Contact</Link></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6">Resources</h4>
            <ul className="space-y-4 text-gray-600">
              <li><Link to="/news" className="hover:text-[var(--color-primary)] transition">Medical News</Link></li>
              <li><Link to="/blog" className="hover:text-[var(--color-primary)] transition">Blog</Link></li>
              <li><Link to="/help" className="hover:text-[var(--color-primary)] transition">Help Center</Link></li>
              <li><Link to="/guidelines" className="hover:text-[var(--color-primary)] transition">Community Guidelines</Link></li>
            </ul>
          </div>

          {/* Links 3 */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6">Legal</h4>
            <ul className="space-y-4 text-gray-600">
              <li><Link to="/privacy" className="hover:text-[var(--color-primary)] transition">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-[var(--color-primary)] transition">Terms of Service</Link></li>
              <li><Link to="/cookies" className="hover:text-[var(--color-primary)] transition">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} DocSpace Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
