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

  /* PROFILE COMPLETED*/
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
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="h-16 flex items-center justify-between gap-3">

          {/* LOGO */}
          <Link to="/" className="shrink-0 flex items-center">
            <img src={logo1} alt="DocSpace Logo" className="h-8 sm:h-10" />
          </Link>

          {/* SEARCH */}
          {signedIn && (
            <div className="flex-1 max-w-full sm:max-w-2xl mx-1 sm:mx-2 md:mx-4 min-w-0">
              <div className="relative">
                <PeopleSearch />
              </div>
            </div>
          )}

          {/* DESKTOP NAV */}
          <div className="hidden lg:flex items-center gap-2">
                        {/* USER NAV */}
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

            {/* HOSPITAL NAV */}
            {signedIn && role === "hospital" && (
              <>
                <NavItem to="/find-doctor" icon="person_search" label="Find Doctor" />
                <NavItem to="/hospital-profile" icon="person" label="Profile" />
                <NavItem to="/post-job" icon="add_business" label="Post Job" />
                <NavItem to="/posted-jobs" icon="work" label="Jobs" />
                <NavItem to="/messages" icon="chat" label="Chat" />
              </>
            )}

            {/* ADMIN NAV */}
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
               className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <span className="material-symbols-outlined">notifications</span>

                {hasUpdates && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full" />
                )}
              </button>
            )}

            {/* PROFILE + LOGOUT */}
            {signedIn ? (
              <>
                <Link
                  to="/dashboard"
                  className="w-10 h-10 rounded-full bg-red-400 text-white flex items-center justify-center font-semibold"
                >
                  {role === "admin" ? "A" : role === "hospital" ? "H" : "U"}
                </Link>

                {/* <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <span className="material-symbols-outlined">logout</span>
                  Logout
                </button> */}
              </>
            ) : !isAuthPage && (
              <button
                onClick={() => navigate("/auth")}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                Login
              </button>
            )}
          </div>

          {/* MOBILE BUTTONS */}
          <div className="lg:hidden flex items-center gap-2">
            {signedIn && (
              <button
                onClick={() => setShowNotifications(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <span className="material-symbols-outlined">notifications</span>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
            >
              <span className="material-symbols-outlined">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
            {/* PROFILE ICON (ALL ROLES) */}
          {signedIn && (
         <Link
         to="/dashboard"
         className="w-10 h-10 rounded-full bg-red-400 text-white flex items-center justify-center font-semibold"
         >
          {role === "admin" ? "A" : role === "hospital" ? "H" : "U"}
         </Link>
        )}
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t py-4 space-y-2">
            
            {signedIn && role === "hospital" && (
            <>
             <MobileNavItem to="/find-doctor" label="Find Doctor" />
              <MobileNavItem to="/hospital-profile" label="Profile" />
              <MobileNavItem to="/post-job" label="Post Job" />
              <MobileNavItem to="/posted-jobs" label="Posted Jobs" />
               <MobileNavItem to="/messages" label="Chat" />
            </>
            )}


            {signedIn && role !== "hospital" && role !== "admin" && (
               <>
              <MobileNavItem to="/find-doctor" label="Find Doctor" />
              <MobileNavItem to="/search/jobs" label="Find Jobs" />
              <MobileNavItem to="/resume" label="Resume" />
              <MobileNavItem to="/messages" label="Chat" />
              {profileCompleted && (
                 <MobileNavItem to="/get-verified" label="Get Verified" />
              )}
            </>
            )}

            {signedIn && (
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-red-600"
              >
                Logout
              </button>
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
    <Link to={to} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg">
      <span className="material-symbols-outlined">{icon}</span>
      {label}
    </Link>
  );
}

function MobileNavItem({ to, label }) {
  return (
    <Link to={to} className="block px-4 py-2 hover:bg-gray-100">
      {label}
    </Link>
  );
}

