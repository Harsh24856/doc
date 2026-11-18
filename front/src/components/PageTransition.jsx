import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Route change: new page fades in with an 8px rise (300ms ease-out).
 * Keyed on pathname so each route mounts fresh; scrolls to top on navigation.
 */
export default function PageTransition({ children }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <main key={pathname} className="min-h-screen w-full animate-fade-up">
      {children}
    </main>
  );
}
