import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Navbar({ signedIn, setSignedIn, role}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setSignedIn(false);
    setOpen(false);
    navigate("/login");
  };

  return (
    <nav className="w-full bg-white border-b shadow-sm">
      <div className="relative w-full px-6 py-2 flex items-center">
        
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-blue-600">
          DocSpace 🩺
        </Link>

        {/* Center links */}
        <div className="absolute left-1/2 -translate-x-1/2 flex space-x-8 text-gray-700 font-medium">
          <Link to={role === "doctor"?"/":"/hospital-profile"} className="hover:text-blue-600 transition">
             Profile(Set-up)
          </Link>
          <Link className="hover:text-blue-600 transition" to="/">
             Feed
          </Link>
          <Link className="hover:text-blue-600 transition" to="/">
             Jobs
          </Link>
          <Link className="hover:text-blue-600 transition" to="/">
             Connect
          </Link>
        </div>

        {/* Right side */}
        <div className="ml-auto relative">
          {signedIn ? (
            <>
              {/* Profile Icon */}
              <button
                onClick={() => setOpen(!open)}
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold focus:outline-none"
              >
                U
              </button>

              {/* Dropdown */}
              {open && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border z-50">
                  <Link
                    to="/"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
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
