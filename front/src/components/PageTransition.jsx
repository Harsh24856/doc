import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function PageTransition({ children }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [location.pathname, children]);

  return (
    <div
      className={`page-transition ${isTransitioning ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 ease-in-out`}
      key={location.pathname}
    >
      {displayChildren}
    </div>
  );
}

