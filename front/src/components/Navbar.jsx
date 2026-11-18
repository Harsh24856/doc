import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import PeopleSearch from "./PeopleSearch";
import NotificationsModal from "./NotificationsModal";
import API_BASE_URL from "../config/api.js";
import logo1 from "../assets/1.png";
import socket from "../socket/socket.js";
import { Button, Icon, cn, dur, easeIn, easeOut, enter } from "../ui";

const NAV = {
  doctor: [
    { to: "/find-doctor", icon: "person_search", label: "Find Doctor" },
    { to: "/search/jobs", icon: "work", label: "Jobs" },
    { to: "/resume", icon: "description", label: "Resume" },
    { to: "/messages", icon: "chat", label: "Chat" },
  ],
  hospital: [
    { to: "/find-doctor", icon: "person_search", label: "Find Doctor" },
    { to: "/hospital-profile", icon: "apartment", label: "Profile" },
    { to: "/post-job", icon: "add_business", label: "Post Job" },
    { to: "/posted-jobs", icon: "work", label: "Jobs" },
    { to: "/messages", icon: "chat", label: "Chat" },
  ],
  admin: [
    { to: "/admin", icon: "stethoscope", label: "Doctors" },
    { to: "/admin-hospital", icon: "local_hospital", label: "Hospitals" },
  ],
};

export default function Navbar({ signedIn, role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasUpdates, setHasUpdates] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  const isAuthPage = ["/auth", "/login", "/signup", "/signUp"].includes(location.pathname);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("authFormMode");
    socket.disconnect();
    window.dispatchEvent(new Event("logout"));
    setMenuOpen(false);
    setMobileMenuOpen(false);
    navigate("/auth");
  };

  /* Close menus on navigation */
  useEffect(() => {
    setMobileMenuOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  /* Elevate the bar once the page scrolls */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Click outside closes the account menu */
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false);
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  /* Profile completion (doctors only) gates the Verify link */
  useEffect(() => {
    if (!signedIn || role === "hospital" || role === "admin") return;
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/profile/medical-resume`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setProfileCompleted(!!data?.profile_completed))
      .catch(() => {});
  }, [signedIn, role]);

  const checkNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
        throw new Error("Unauthorized");
      }
      if (!res.ok) return;
      const data = await res.json();
      setHasUpdates((data.unread_count || 0) > 0);
    } catch {
      setHasUpdates(false);
    }
  };

  useEffect(() => {
    if (!signedIn) return;
    const handle = () => checkNotifications();
    socket.on("notifications_updated", handle);
    return () => socket.off("notifications_updated", handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn || !localStorage.getItem("token")) return;
    checkNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  const roleKey = role === "hospital" ? "hospital" : role === "admin" ? "admin" : "doctor";
  const items = signedIn
    ? [...NAV[roleKey], ...(roleKey === "doctor" && profileCompleted ? [{ to: "/get-verified", icon: "verified", label: "Verify" }] : [])]
    : [];

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }
  const displayName = user?.name || (role === "admin" ? "Admin" : role === "hospital" ? "Hospital" : "Doctor");
  const initial = displayName.charAt(0).toUpperCase();
  const roleLabel = role === "admin" ? "Administrator" : role === "hospital" ? "Hospital" : "Doctor";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b bg-white transition-[border-color,box-shadow] duration-200",
        scrolled ? "border-gray-200 shadow-[var(--shadow-soft)]" : "border-gray-200/70"
      )}
    >
      <nav className="ds-container flex h-16 items-center gap-3 lg:gap-5" aria-label="Primary">
        <Link to="/" className="flex shrink-0 items-center" aria-label="DocSpace home">
          <img src={logo1} alt="DocSpace" className="h-8 sm:h-9" />
        </Link>

        {signedIn && (
          <div className="min-w-0 flex-1 lg:max-w-md">
            <PeopleSearch />
          </div>
        )}
        {!signedIn && <div className="flex-1" />}

        {/* Desktop links with a sliding active indicator */}
        <ul className="hidden items-stretch lg:flex">
          {items.map((it) => (
            <li key={it.to}>
              <NavLink
                to={it.to}
                className={({ isActive }) =>
                  cn(
                    "relative flex h-16 items-center gap-1.5 px-3 font-mono text-[11px] font-bold uppercase tracking-[0.1em] transition-colors duration-150",
                    isActive ? "text-coral-700" : "text-gray-500 hover:text-gray-900"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span layoutId="nav-active" transition={enter} className="absolute inset-x-3 bottom-0 h-0.5 bg-primary" />
                    )}
                    <Icon name={it.icon} fill={isActive} className="text-[18px]" />
                    {it.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-1">
          {signedIn && (
            <button
              onClick={() => setShowNotifications(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900"
              aria-label={hasUpdates ? "Notifications, unread updates" : "Notifications"}
            >
              <Icon name="notifications" fill={hasUpdates} />
              <AnimatePresence>
                {hasUpdates && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, transition: { duration: dur.base, ease: easeOut } }}
                    exit={{ scale: 0, opacity: 0, transition: { duration: dur.quick, ease: easeIn } }}
                    className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-coral-500 ring-2 ring-white"
                  />
                )}
              </AnimatePresence>
            </button>
          )}

          {signedIn ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex h-10 items-center gap-1 rounded-full pl-1 pr-1 transition-colors duration-150 hover:bg-gray-100 sm:pr-2"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{initial}</span>
                <Icon name="expand_more" className={cn("hidden text-[20px] text-gray-500 transition-transform duration-200 sm:block", menuOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: dur.quick, ease: easeOut } }}
                    exit={{ opacity: 0, y: -4, transition: { duration: dur.fast, ease: easeIn } }}
                    className="absolute right-0 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-[var(--shadow-lift)]"
                  >
                    <div className="px-3 py-2.5">
                      <p className="truncate text-sm font-bold text-gray-900">{displayName}</p>
                      <p className="truncate text-xs text-gray-500">{user?.email || roleLabel}</p>
                    </div>
                    <div className="my-1 h-px bg-gray-100" />
                    <MenuItem to="/dashboard" icon="space_dashboard" label="Dashboard" />
                    <MenuItem to="/notifications" icon="notifications" label="All notifications" />
                    {roleKey === "doctor" && <MenuItem to="/resume" icon="description" label="My resume" />}
                    {roleKey === "hospital" && <MenuItem to="/hospital-profile" icon="apartment" label="Hospital profile" />}
                    <div className="my-1 h-px bg-gray-100" />
                    <button
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-coral-700 transition-colors duration-150 hover:bg-coral-50"
                    >
                      <Icon name="logout" className="text-[20px]" />
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            !isAuthPage && (
              <Button size="sm" onClick={() => navigate("/auth")} iconRight="arrow_forward">
                Log in
              </Button>
            )
          )}

          {signedIn && (
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 hover:bg-gray-100 lg:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              <Icon name={mobileMenuOpen ? "close" : "menu"} />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile drawer: slides in from the right (transform only) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 top-16 z-40 bg-gray-900/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: dur.base, ease: easeOut } }}
              exit={{ opacity: 0, transition: { duration: dur.quick, ease: easeIn } }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              className="fixed bottom-0 right-0 top-16 z-50 flex w-[min(20rem,85vw)] flex-col border-l border-gray-200 bg-white p-4 lg:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0, transition: { duration: dur.base, ease: easeOut } }}
              exit={{ x: "100%", transition: { duration: dur.quick, ease: easeIn } }}
            >
              <ul className="space-y-1">
                {items.map((it) => (
                  <li key={it.to}>
                    <NavLink
                      to={it.to}
                      className={({ isActive }) =>
                        cn(
                          "flex h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold",
                          isActive ? "bg-coral-50 text-coral-700" : "text-gray-700 hover:bg-gray-100"
                        )
                      }
                    >
                      <Icon name={it.icon} />
                      {it.label}
                    </NavLink>
                  </li>
                ))}
                <li>
                  <NavLink to="/dashboard" className="flex h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold text-gray-700 hover:bg-gray-100">
                    <Icon name="space_dashboard" />
                    Dashboard
                  </NavLink>
                </li>
              </ul>
              <div className="mt-auto border-t border-gray-100 pt-4">
                <Button variant="soft" className="w-full" icon="logout" onClick={handleLogout}>
                  Log out
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {signedIn && (
        <NotificationsModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} onMarkedRead={checkNotifications} />
      )}
    </header>
  );
}

function MenuItem({ to, icon, label }) {
  return (
    <Link
      role="menuitem"
      to={to}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900"
    >
      <Icon name={icon} className="text-[20px] text-gray-500" />
      {label}
    </Link>
  );
}
