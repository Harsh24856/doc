import { Link } from "react-router-dom";
import logo1 from "../assets/1.png";
import { Icon } from "../ui";

const columns = [
  {
    title: "For doctors",
    links: [
      { to: "/search/jobs", label: "Find jobs" },
      { to: "/resume", label: "Medical resume" },
      { to: "/get-verified", label: "Get verified" },
      { to: "/find-doctor", label: "Find a doctor" },
    ],
  },
  {
    title: "For hospitals",
    links: [
      { to: "/post-job", label: "Post a job" },
      { to: "/hospital-profile", label: "Hospital profile" },
      { to: "/posted-jobs", label: "Manage jobs" },
    ],
  },
  {
    title: "Stay informed",
    links: [
      { to: "/news", label: "Medical news" },
      { to: "/who", label: "WHO updates" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="ds-container py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <img src={logo1} alt="DocSpace" className="h-9" />
            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              The professional network for verified healthcare professionals. Doctors, hospitals and institutions, connected securely.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Icon name="mail" className="text-[18px] text-gray-400" />
                <a href="mailto:Docspace2430@gmail.com" className="hover:text-coral-700">
                  Docspace2430@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Icon name="location_on" className="text-[18px] text-gray-400" />
                PEC, Chandigarh
              </li>
            </ul>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="group inline-flex items-center gap-1 text-sm font-medium text-gray-700 transition-colors duration-150 hover:text-coral-700">
                      {l.label}
                      <Icon name="arrow_forward" className="text-[14px] opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-6 text-sm text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} DocSpace. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Privacy policy</span>
            <span>Terms of service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
