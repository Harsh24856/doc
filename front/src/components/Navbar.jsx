import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

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
      <nav className="w-full bg-white border-b shadow-sm">
        <div className="w-full px-6 py-2 flex items-center">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-blue-600">
            DocSpace 🏥
          </Link>

          {/* Hospital Links */}
          <div className="ml-10 flex space-x-8 text-gray-700 font-medium">
            <Link to="/hospital-profile" className="hover:text-blue-600">
              Hospital Profile
            </Link>
            <Link to="/jobs" className="hover:text-blue-600">
              Post Jobs
            </Link>
            <Link to="/applications" className="hover:text-blue-600">
              Applications
            </Link>
            <Link to="/connect" className="hover:text-blue-600">
              Connect
            </Link>
          </div>

          {/* Right */}
          <div className="ml-auto relative">
            <button
              onClick={() => setOpen(!open)}
              className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold"
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
    <nav className="w-full bg-white border-b shadow-sm">
      <div className="relative w-full px-6 py-2 flex items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-blue-600">
          DocSpace 🩺
        </Link>

        {/* Center links */}
        <div className="absolute left-1/2 -translate-x-1/2 flex space-x-8 text-gray-700 font-medium">
          <Link
            to={ "/resume" }
            className="hover:text-blue-600 transition"
          >
            Resume
          </Link>
          <Link className="hover:text-blue-600 transition" to="/who">
            WHO
          </Link>
          <Link className="hover:text-blue-600 transition" to="/messages">
            Chat
          </Link>
          <Link className="hover:text-blue-600 transition" to="/get-verified">
            Get-Verified
          </Link>
        </div>

        {/* Right side */}
        <div className="ml-auto relative flex items-center gap-4">
          {role === "admin" && (
            <Link
              to="/admin"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              Admin Dashboard
            </Link>
          )}
          {signedIn ? (
            <>
              <button
                onClick={() => setOpen(!open)}
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold"
              >
                U
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
              className="text-blue-600 hover:underline"
              onClick={() => navigate("/login")}
            >
              Log in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}