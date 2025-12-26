import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import PeopleSearch from "./PeopleSearch";
import NotificationsModal from "./NotificationsModal";
import API_BASE_URL from "../config/api.js";

export default function Navbar({ signedIn, setSignedIn, role }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setSignedIn(false);
    setOpen(false);
    navigate("/login");
  };

  /* =========================
     CHECK PROFILE COMPLETION
     ========================= */
  useEffect(() => {
    const checkProfileCompleted = async () => {
      // Only check for signed-in users who are not hospitals or admins
      if (!signedIn || role === "hospital" || role === "admin") {
        setProfileCompleted(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setProfileCompleted(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/profile/medical-resume`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setProfileCompleted(data.profile_completed || false);
        } else {
          setProfileCompleted(false);
        }
      } catch (err) {
        console.error("[Navbar] Error checking profile:", err);
        setProfileCompleted(false);
      }
    };

    checkProfileCompleted();
  }, [signedIn, role]);

  /* =========================
     FETCH UNREAD NOTIFICATIONS COUNT
     ========================= */
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!signedIn) {
        setUnreadCount(0);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setUnreadCount(0);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const readNotifications = JSON.parse(localStorage.getItem("readNotifications") || "[]");
          
          // Count unread notifications (not in readNotifications array)
          const unread = (data.notifications || []).filter(n => !readNotifications.includes(n.id)).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error("[Navbar] Error fetching unread count:", err);
      }
    };

    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [signedIn]);

  /* =========================
     HOSPITAL NAVBAR
     ========================= */
  if (signedIn && role === "hospital") {
    return (
      <nav className="w-full bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          {/* LEFT: Logo */}
          <Link to="/" className="text-2xl font-bold text-[var(--color-primary)] flex items-center gap-2 shrink-0">
             DocSpace <span className="text-gray-400 text-sm font-normal">Hospital</span>
          </Link>

          {/* MIDDLE: Search Bar */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <PeopleSearch />
          </div>

          {/* RIGHT: Links & Profile */}
          <div className="flex items-center gap-6">
          {/* Hospital Links */}
            <div className="hidden lg:flex items-center space-x-6 text-gray-600 font-medium text-sm">
            <Link to="/hospital-profile" className="hover:text-[var(--color-primary)] transition flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">person</span>
              Profile
            </Link>
            <Link to="/post-job" className="hover:text-[var(--color-primary)] transition flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">add_business</span>
              Post Jobs
            </Link>
            <Link to="/posted-jobs" className="hover:text-[var(--color-primary)] transition flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">work</span>
              Posted Jobs
            </Link>
            <Link to="/chat" className="hover:text-[var(--color-primary)] transition flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">chat</span>
              Chat
            </Link>
          </div>

            {/* Notifications */}
            {signedIn && (
              <>
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative w-10 h-10 flex items-center justify-center text-gray-600 hover:text-[var(--color-primary)] transition rounded-full hover:bg-gray-100"
                >
                  <span className="material-symbols-outlined text-2xl">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationsModal
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                />
              </>
            )}

            {/* User Menu */}
          <div className="relative">
              <Link
                to="/dashboard"
              className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-semibold shadow-md hover:bg-[var(--color-primary-dark)] transition"
            >
              H
                </Link>
              </div>
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
            <Link to="/search/jobs" className="hover:text-[var(--color-primary)] transition flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">search</span>
              Find Jobs
            </Link>
            <Link to="/resume" className="hover:text-[var(--color-primary)] transition flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">description</span>
              Resume
            </Link>
            <Link className="hover:text-[var(--color-primary)] transition flex items-center gap-1.5" to="/messages">
              <span className="material-symbols-outlined text-lg">chat</span>
              Chat
            </Link>
            {profileCompleted && (
            <Link className="hover:text-[var(--color-primary)] transition flex items-center gap-1.5" to="/get-verified">
              <span className="material-symbols-outlined text-lg">verified</span>
              Get Verified
            </Link>
            )}
          </div>

          {/* User / Auth */}
          <div className="relative flex items-center gap-4">
            {role === "admin" && (
              <>
                <Link
                  to="/admin"
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-medium text-sm"
                >
                  Admin
                </Link>
                <Link
                  to="/admin-hospital"
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition font-medium text-sm"
                >
                  Admin Hospital
                </Link>
              </>
            )}

            {/* Notifications */}
            {signedIn && (
              <>
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative w-10 h-10 flex items-center justify-center text-gray-600 hover:text-[var(--color-primary)] transition rounded-full hover:bg-gray-100"
                >
                  <span className="material-symbols-outlined text-2xl">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationsModal
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                />
              </>
            )}

            {signedIn ? (
              <Link
                to="/dashboard"
                  className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-semibold shadow-md hover:bg-[var(--color-primary-dark)] transition"
                >
                  {role === "hospital" ? "H" : "U"}
                    </Link>
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
