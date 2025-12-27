import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import PeopleSearch from "./PeopleSearch";
import NotificationsModal from "./NotificationsModal";
import API_BASE_URL from "../config/api.js";
import logo1 from "../assets/1.png";

export default function Navbar({ signedIn, role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth" || location.pathname === "/login" || location.pathname === "/signup" || location.pathname === "/signUp";
  
  // Check which auth form is currently visible
  const [authFormMode, setAuthFormMode] = useState(() => {
    return localStorage.getItem('authFormMode') || 'login';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const mode = localStorage.getItem('authFormMode') || 'login';
      setAuthFormMode(mode);
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also check on mount and route change
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location.pathname]);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* =========================
     PROFILE COMPLETED
     ========================= */
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

  /* =========================
     NOTIFICATIONS COUNT
     ========================= */
  useEffect(() => {
    if (!signedIn) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unread_count || 0);
        }
      } catch {}
    };

    fetchNotifications();
    const i = setInterval(fetchNotifications, 30000);
    return () => clearInterval(i);
  }, [signedIn]);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="h-16 flex items-center justify-between gap-3">
          
          {/* LOGO */}
          <Link
            to="/"
            className="shrink-0 flex items-center hover:opacity-80 transition"
          >
            <img 
              src={logo1} 
              alt="DocSpace Logo" 
              className="h-8 sm:h-10 w-auto object-contain"
            />
          </Link>

          {/* SEARCH BAR - Only visible when signed in */}
          {signedIn && (
            <div className="flex-1 max-w-2xl mx-2 sm:mx-4">
              <div className="relative">
                <PeopleSearch />
              </div>
            </div>
          )}

          {/* DESKTOP ACTIONS */}
          <div className="hidden lg:flex items-center gap-2">
            {/* NAV LINKS */}
            {signedIn && role !== "hospital" && role !== "admin" && (
              <>
                <NavItem to="/find-doctor" icon="person_search" label="Find Doctor" />
                <NavItem to="/search/jobs" icon="work" label="Find Jobs" />
                <NavItem to="/resume" icon="description" label="Resume" />
                <NavItem to="/messages" icon="chat" label="Chat" />
                {profileCompleted && (
                  <NavItem to="/get-verified" icon="verified" label="Verify" />
                )}
              </>
            )}

            {signedIn && role === "hospital" && (
              <>
                <NavItem to="/find-doctor" icon="person_search" label="Find Doctor" />
                <NavItem to="/hospital-profile" icon="person" label="Profile" />
                <NavItem to="/post-job" icon="add_business" label="Post Job" />
                <NavItem to="/posted-jobs" icon="work" label="Jobs" />
                <NavItem to="/messages" icon="chat" label="Chat" />
              </>
            )}

            {signedIn && role === "admin" && (
              <>
                <NavItem to="/admin" icon="dashboard" label="Dashboard" />
                <NavItem to="/admin-hospital" icon="local_hospital" label="Hospitals" />
              </>
            )}

            {/* NOTIFICATIONS */}
            {signedIn && (
              <button
                onClick={() => setShowNotifications(true)}
                className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined text-xl text-gray-700">
                  notifications
                </span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold shadow-md">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* DASHBOARD / AUTH BUTTONS */}
            {signedIn ? (
              <Link
                to="/dashboard"
                className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white flex items-center justify-center text-sm font-semibold hover:shadow-lg transition-all hover:scale-105"
                aria-label="Dashboard"
              >
                {role === "hospital" ? "H" : role === "admin" ? "A" : "U"}
              </Link>
            ) : isAuthPage ? (
              authFormMode === 'login' ? (
                <button
                  onClick={() => {
                    // Toggle to signup form
                    window.dispatchEvent(new CustomEvent('toggleAuthForm', { detail: { showSignup: true } }));
                  }}
                  className="px-4 py-2 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-accent)] rounded-lg transition"
                >
                  Sign Up
                </button>
              ) : (
                <button
                  onClick={() => {
                    // Toggle to login form
                    window.dispatchEvent(new CustomEvent('toggleAuthForm', { detail: { showLogin: true } }));
                  }}
                  className="px-4 py-2 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-accent)] rounded-lg transition"
                >
                  Login
                </button>
              )
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="px-4 py-2 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-accent)] rounded-lg transition"
              >
                Login
              </button>
            )}
          </div>

          {/* MOBILE MENU BUTTON */}
          <div className="lg:hidden flex items-center gap-2">
            {signedIn && (
              <button
                onClick={() => setShowNotifications(true)}
                className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined text-xl text-gray-700">
                  notifications
                </span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}

            {signedIn ? (
              <Link
                to="/dashboard"
                className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white flex items-center justify-center text-sm font-semibold"
                aria-label="Dashboard"
              >
                {role === "hospital" ? "H" : role === "admin" ? "A" : "U"}
              </Link>
            ) : isAuthPage ? (
              authFormMode === 'login' ? (
                <button
                  onClick={() => {
                    // Toggle to signup form
                    window.dispatchEvent(new CustomEvent('toggleAuthForm', { detail: { showSignup: true } }));
                  }}
                  className="px-3 py-1.5 text-sm font-semibold text-[var(--color-primary)]"
                >
                  Sign Up
                </button>
              ) : (
                <button
                  onClick={() => {
                    // Toggle to login form
                    window.dispatchEvent(new CustomEvent('toggleAuthForm', { detail: { showLogin: true } }));
                  }}
                  className="px-3 py-1.5 text-sm font-semibold text-[var(--color-primary)]"
                >
                  Login
                </button>
              )
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="px-3 py-1.5 text-sm font-semibold text-[var(--color-primary)]"
              >
                Login
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              <span className="material-symbols-outlined text-2xl text-gray-700">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white py-4 animate-fadeIn">
            <div className="flex flex-col gap-2">
              {signedIn && role !== "hospital" && role !== "admin" && (
                <>
                  <MobileNavItem 
                    to="/find-doctor" 
                    icon="person_search" 
                    label="Find Doctor" 
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <MobileNavItem 
                    to="/search/jobs" 
                    icon="work" 
                    label="Find Jobs" 
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <MobileNavItem 
                    to="/resume" 
                    icon="description" 
                    label="Resume" 
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <MobileNavItem 
                    to="/messages" 
                    icon="chat" 
                    label="Chat" 
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  {profileCompleted && (
                    <MobileNavItem 
                      to="/get-verified" 
                      icon="verified" 
                      label="Get Verified" 
                      onClick={() => setMobileMenuOpen(false)}
                    />
                  )}
                </>
              )}

              {signedIn && role === "hospital" && (
                <>
                  <MobileNavItem 
                    to="/find-doctor" 
                    icon="person_search" 
                    label="Find Doctor" 
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <MobileNavItem 
                    to="/hospital-profile" 
                    icon="person" 
                    label="Profile" 
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <MobileNavItem 
                    to="/post-job" 
                    icon="add_business" 
                    label="Post Job" 
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <MobileNavItem 
                    to="/posted-jobs" 
                    icon="work" 
                    label="My Jobs" 
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <MobileNavItem 
                    to="/messages" 
                    icon="chat" 
                    label="Chat" 
                    onClick={() => setMobileMenuOpen(false)}
                  />
                </>
              )}

              {signedIn && role === "admin" && (
                <>
                  <MobileNavItem 
                    to="/admin" 
                    icon="dashboard" 
                    label="Dashboard" 
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <MobileNavItem 
                    to="/admin-hospital" 
                    icon="local_hospital" 
                    label="Hospitals" 
                    onClick={() => setMobileMenuOpen(false)}
                  />
                </>
              )}

              {!signedIn && (
                <>
                  {isAuthPage ? (
                    authFormMode === 'login' ? (
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('toggleAuthForm', { detail: { showSignup: true } }));
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition"
                      >
                        <span className="material-symbols-outlined">person_add</span>
                        <span className="font-medium">Sign Up</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('toggleAuthForm', { detail: { showLogin: true } }));
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition"
                      >
                        <span className="material-symbols-outlined">login</span>
                        <span className="font-medium">Login</span>
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => {
                        navigate("/auth");
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition"
                    >
                      <span className="material-symbols-outlined">person_add</span>
                      <span className="font-medium">Sign Up</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* NOTIFICATIONS MODAL */}
      {signedIn && (
        <NotificationsModal
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </nav>
  );
}

/* =========================
   NAV ITEM (DESKTOP)
   ========================= */
function NavItem({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-[var(--color-primary)] transition-all font-medium text-sm"
    >
      <span className="material-symbols-outlined text-xl">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

/* =========================
   MOBILE NAV ITEM
   ========================= */
function MobileNavItem({ to, icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium"
    >
      <span className="material-symbols-outlined text-2xl">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}