import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import PeopleSearch from "./PeopleSearch";

export default function Navbar({ signedIn, setSignedIn, role }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setSignedIn(false);
    setOpen(false);
    navigate("/login");
  };

  /* =========================
     HOSPITAL NAVBAR
     ========================= */
  if (signedIn && role === "hospital") {
    return (
      <nav className="w-full bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-[var(--color-primary)] flex items-center gap-2">
             DocSpace <span className="text-gray-400 text-sm font-normal">Hospital</span>
          </Link>

          {/* Hospital Links */}
          <div className="hidden md:flex items-center space-x-8 text-gray-600 font-medium">
            <Link to="/hospital-profile" className="hover:text-[var(--color-primary)] transition">
              Profile
            </Link>
            <Link to="/post-job" className="hover:text-[var(--color-primary)] transition">
              Post Jobs
            </Link>
            <Link to="/posted-jobs" className="hover:text-[var(--color-primary)] transition">
              Posted Jobs
            </Link>
          </div>

          {/* Right */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-semibold shadow-md hover:bg-[var(--color-primary-dark)] transition"
            >
              H
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border z-50">
                <div className="flex items-center justify-between px-4 py-2 border-b">
                  <span className="font-semibold text-gray-700">Menu</span>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                    aria-label="Close menu"
                  >
                    ×
                  </button>
                </div>
                <Link
                  to="/hospital-profile"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    );
  }

  /* =========================
     DEFAULT NAVBAR (DOCTOR / OTHERS)
     ========================= */
  return (
    <nav className="w-full bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="w-full max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">

        {/* LEFT: Logo */}
        <Link to="/" className="text-2xl font-bold text-[var(--color-primary)] shrink-0">
          DocSpace 🩺
        </Link>

        {/* MIDDLE: Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
           <PeopleSearch />
        </div>

        {/* RIGHT: Links & Profile */}
        <div className="flex items-center gap-6">

          {/* Nav Links */}
          <div className="hidden lg:flex items-center space-x-6 text-gray-600 font-medium text-sm">
            <Link to="/search/jobs" className="hover:text-[var(--color-primary)] transition">
              Find Jobs
            </Link>
            <Link to="/resume" className="hover:text-[var(--color-primary)] transition">
              Resume
            </Link>
            <Link className="hover:text-[var(--color-primary)] transition" to="/messages">
              Chat
            </Link>
            <Link className="hover:text-[var(--color-primary)] transition" to="/get-verified">
              Get Verified
            </Link>
          </div>

          {/* User / Auth */}
          <div className="relative flex items-center gap-4">
            {role === "admin" && (
              <Link
                to="/admin"
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-medium text-sm"
              >
                Admin
              </Link>
            )}

            {signedIn ? (
              <>
                <button
                  onClick={() => setOpen(!open)}
                  className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-semibold shadow-md hover:bg-[var(--color-primary-dark)] transition"
                >
                  {role === "hospital" ? "H" : "U"}
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border z-50">
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                      <span className="font-semibold text-gray-700">Menu</span>
                      <button
                        onClick={() => setOpen(false)}
                        className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                        aria-label="Close menu"
                      >
                        ×
                      </button>
                    </div>
                    <Link
                      to="/"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                className="text-[var(--color-primary)] hover:underline font-medium"
                onClick={() => navigate("/login")}
              >
                Log in
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
