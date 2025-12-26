import { useLocation } from "react-router-dom";

export default function PageTransition({ children }) {
  const location = useLocation();

  return (
    <div
      className="page-transition fadeIn"
      key={location.pathname}
    >
      {children}
    </div>
  );
}

