import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import PeopleSearch from "./PeopleSearch";
import NotificationsModal from "./NotificationsModal";
import API_BASE_URL from "../config/api.js";
import logo1 from "../assets/1.png";
import socket from "../socket/socket.js";

export default function Navbar({ signedIn, role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasUpdates, setHasUpdates] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authFormMode");
    socket.disconnect();
    navigate("/");
  };

  const isAuthPage =
    location.pathname === "/auth" ||
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/signUp";

  const [authFormMode, setAuthFormMode] = useState(
    () => localStorage.getItem("authFormMode") || "login"
  );
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* AUTH FORM MODE SYNC */
  useEffect(() => {
    const handleStorageChange = () => {
      setAuthFormMode(localStorage.getItem("authFormMode") || "login");
    };

    window.addEventListener("storage", handleStorageChange);
    handleStorageChange();

    return () => window.removeEventListener("storage", handleStorageChange);
  }, [location.pathname]);

  /* PROFILE COMPLETED */
  useEffect(() => {
    if (!signedIn || role === "hospital" || role === "admin") return;

    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_BASE_URL}/profile/medical-resume`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setProfileCompleted(!!data?.profile_completed))
      .catch(() => {});
  }, [signedIn, role]);

  const checkNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data = await res.json();
      setHasUpdates((data.unread_count || 0) > 0);
    } catch {
      setHasUpdates(false);
    }
  };

  useEffect(() => {
    if (!signedIn) return;

    const handleNotificationsUpdate = () => {
      checkNotifications();
    };

    socket.on("notifications_updated", handleNotificationsUpdate);

    return () => {
      socket.off("notifications_updated", handleNotificationsUpdate);
    };
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    checkNotifications();
  }, [signedIn]);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* LOGO */}
          <Link to="/" className="shrink-0 flex items-center gap-2 group">
            <img src={logo1} alt="DocSpace Logo" className="h-8 sm:h-9 group-hover:scale-105 transition-transform duration-200" />
            <span className="text-xl font-bold text-gray-800 tracking-tight hidden md:block">DocSpace</span>
          </Link>

          {/* SEARCH */}
          {signedIn && (
            <div className="flex-1 max-w-lg mx-auto">
              <div className="relative">
                <PeopleSearch />
              </div>
            </div>
          )}

          {/* DESKTOP NAV */}
          <div className="hidden lg:flex items-center gap-1">
            {/* USER NAV */}
            {signedIn && role !== "hospital" && role !== "admin" && (
              <>
                <NavItem to="/find-doctor" icon="person_search" label="Doctors" />
                <NavItem to="/search/jobs" icon="work" label="Jobs" />
                <NavItem to="/resume" icon="description" label="Resume" />
                <NavItem to="/messages" icon="chat" label="Chat" />
                {profileCompleted && (
                  <NavItem to="/get-verified" icon="verified" label="Verify" />
                )}
              </>
            )}

            {/* HOSPITAL NAV */}
            {signedIn && role === "hospital" && (
              <>
                <NavItem to="/find-doctor" icon="person_search" label="Doctors" />
                <NavItem to="/hospital-profile" icon="local_hospital" label="Profile" />
                <NavItem to="/post-job" icon="add_business" label="Post Job" />
                <NavItem to="/posted-jobs" icon="work" label="My Jobs" />
                <NavItem to="/messages" icon="chat" label="Chat" />
              </>
            )}

            {/* ADMIN NAV */}
            {signedIn && role === "admin" && (
              <>
                <NavItem to="/admin" icon="dashboard" label="Doctors" />
                <NavItem to="/admin-hospital" icon="local_hospital" label="Hospitals" />
              </>
            )}

            {/* NOTIFICATIONS */}
            {signedIn && (
              <button
                onClick={() => setShowNotifications(true)}
                className="relative w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-[var(--color-primary)] transition-colors ml-2"
              >
                <span className="material-symbols-outlined">notifications</span>
                {hasUpdates && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                )}
              </button>
            )}

            {/* PROFILE + LOGOUT */}
            {signedIn ? (
              <div className="pl-2 ml-2 border-l border-gray-200">
                <Link
                  to="/dashboard"
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white flex items-center justify-center font-bold shadow-sm hover:shadow-md transition-all hover:scale-105"
                >
                  {role === "admin" ? "A" : role === "hospital" ? "H" : "D"}
                </Link>
              </div>
            ) : !isAuthPage && (
              <button
                onClick={() => navigate("/auth")}
                className="ml-4 px-5 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-full font-medium shadow-sm hover:shadow transition-all transform hover:-translate-y-0.5"
              >
                Sign In
              </button>
            )}
          </div>

          {/* MOBILE BUTTONS */}
          <div className="lg:hidden flex items-center gap-3">
            {signedIn && (
              <button
                onClick={() => setShowNotifications(true)}
                className="relative w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined">notifications</span>
                {hasUpdates && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                )}
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>

            {/* PROFILE ICON (ALL ROLES) */}
            {signedIn && (
              <Link
                to="/dashboard"
                className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white flex items-center justify-center font-bold shadow-sm"
              >
                {role === "admin" ? "A" : role === "hospital" ? "H" : "D"}
              </Link>
            )}
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-4 space-y-1 animate-fadeIn">
            {signedIn && role === "hospital" && (
              <>
                <MobileNavItem to="/find-doctor" icon="person_search" label="Find Doctor" onClick={() => setMobileMenuOpen(false)} />
                <MobileNavItem to="/hospital-profile" icon="local_hospital" label="Profile" onClick={() => setMobileMenuOpen(false)} />
                <MobileNavItem to="/post-job" icon="add_business" label="Post Job" onClick={() => setMobileMenuOpen(false)} />
                <MobileNavItem to="/posted-jobs" icon="work" label="Posted Jobs" onClick={() => setMobileMenuOpen(false)} />
                <MobileNavItem to="/messages" icon="chat" label="Chat" onClick={() => setMobileMenuOpen(false)} />
              </>
            )}

            {signedIn && role !== "hospital" && role !== "admin" && (
              <>
                <MobileNavItem to="/find-doctor" icon="person_search" label="Find Doctor" onClick={() => setMobileMenuOpen(false)} />
                <MobileNavItem to="/search/jobs" icon="work" label="Find Jobs" onClick={() => setMobileMenuOpen(false)} />
                <MobileNavItem to="/resume" icon="description" label="Resume" onClick={() => setMobileMenuOpen(false)} />
                <MobileNavItem to="/messages" icon="chat" label="Chat" onClick={() => setMobileMenuOpen(false)} />
                {profileCompleted && (
                  <MobileNavItem to="/get-verified" icon="verified" label="Get Verified" onClick={() => setMobileMenuOpen(false)} />
                )}
              </>
            )}

            {signedIn && role === "admin" && (
              <>
                <MobileNavItem to="/admin" icon="dashboard" label="Doctors" onClick={() => setMobileMenuOpen(false)} />
                <MobileNavItem to="/admin-hospital" icon="local_hospital" label="Hospitals" onClick={() => setMobileMenuOpen(false)} />
              </>
            )}

            {signedIn ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                <span className="material-symbols-outlined">logout</span>
                Logout
              </button>
            ) : (
               !isAuthPage && (
                 <button
                   onClick={() => {
                     navigate("/auth");
                     setMobileMenuOpen(false);
                   }}
                   className="w-full text-center px-4 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-lg mx-auto block mt-4 hover:bg-[var(--color-primary-dark)] transition-colors"
                 >
                   Sign In
                 </button>
               )
            )}
          </div>
        )}
      </div>

      {/* NOTIFICATIONS MODAL */}
      {signedIn && (
        <NotificationsModal
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          onMarkedRead={checkNotifications}
        />
      )}
    </nav>
  );
}

/* HELPERS */
function NavItem({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-[var(--color-primary)] hover:bg-[var(--color-secondary)] rounded-lg transition-all duration-200 font-medium text-sm"
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      {label}
    </Link>
  );
}

function MobileNavItem({ to, icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-[var(--color-primary)] transition-colors"
    >
      <span className="material-symbols-outlined text-gray-500">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
