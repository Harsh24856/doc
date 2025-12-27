import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";
import logo2 from "../assets/2.png";

export default function AllJobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* FILTER STATE (single source of truth) */
  const [filters, setFilters] = useState({
    department: "",
    job_type: "",
    experience: "",
    min_salary: "",
    max_salary: "",
    city: "",
  });

  /* AUTO SEARCH EFFECT */
  useEffect(() => {
    const controller = new AbortController();

    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });

        const url =
          params.toString().length > 0
            ? `${API_BASE_URL}/search?${params.toString()}`
            : `${API_BASE_URL}/jobs`;

        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch jobs");
        }

        setJobs(data.jobs || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    /* debounce */
    const timeout = setTimeout(fetchJobs, 400);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 sm:py-8 md:py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <div className="inline-flex items-center justify-center mb-4 sm:mb-6">
            <img 
              src={logo2} 
              alt="DocSpace Logo" 
              className="h-24 sm:h-32 md:h-40 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Job Openings
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            Discover your next career opportunity in healthcare
          </p>
        </div>

        {/* FILTERS CARD */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 p-4 sm:p-6 md:p-8 lg:p-10 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <span className="material-symbols-outlined text-xl sm:text-2xl text-gray-700">search</span>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Search & Filter</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Input
              label="Department"
              value={filters.department}
              onChange={(v) =>
                setFilters({ ...filters, department: v })
              }
              icon={<span className="material-symbols-outlined text-lg">local_hospital</span>}
            />

            <Input
              label="City"
              value={filters.city}
              onChange={(v) =>
                setFilters({ ...filters, city: v })
              }
              placeholder="e.g. Mumbai, Delhi, Bangalore"
              icon={<span className="material-symbols-outlined text-lg">location_on</span>}
            />

            <Input
              label="Experience"
              value={filters.experience}
              onChange={(v) =>
                setFilters({ ...filters, experience: v })
              }
              placeholder="Years of experience"
              icon={<span className="material-symbols-outlined text-lg">star</span>}
            />

            <Select
              label="Job Type"
              value={filters.job_type}
              onChange={(v) =>
                setFilters({ ...filters, job_type: v })
              }
              options={[
                { label: "Any Type", value: "" },
                { label: "Full Time", value: "full-time" },
                { label: "Part Time", value: "part-time" },
                { label: "Contract", value: "contract" },
              ]}
              icon={<span className="material-symbols-outlined text-lg">medical_services</span>}
            />

            <Input
              label="Min Salary"
              type="number"
              value={filters.min_salary}
              onChange={(v) =>
                setFilters({ ...filters, min_salary: v })
              }
              placeholder="₹"
              icon={<span className="material-symbols-outlined text-lg">payments</span>}
            />

            <Input
              label="Max Salary"
              type="number"
              value={filters.max_salary}
              onChange={(v) =>
                setFilters({ ...filters, max_salary: v })
              }
              placeholder="₹"
              icon={<span className="material-symbols-outlined text-lg">payments</span>}
            />
          </div>

          {/* RESET BUTTON */}
          <div className="flex justify-end mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={() =>
                setFilters({
                  department: "",
                  job_type: "",
                  experience: "",
                  min_salary: "",
                  max_salary: "",
                  city: "",
                })
              }
              className="px-8 py-3 rounded-2xl font-medium text-gray-700 border-2 border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Reset Filters
            </button>
          </div>
        </div>

        {/* RESULTS SECTION */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-10">
          {/* RESULTS HEADER */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {loading ? "Searching..." : `${jobs.length} Job${jobs.length !== 1 ? 's' : ''} Found`}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {loading ? "Please wait..." : "Click on any job to view details"}
              </p>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-2xl p-5">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* RESULTS */}
          {loading ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-gray-400 mb-4 block animate-spin">hourglass_empty</span>
              <p className="text-gray-500">Loading jobs…</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-6xl text-gray-400 mb-4 block">search_off</span>
              <p className="text-xl font-semibold text-gray-800 mb-2">
                No jobs found
              </p>
              <p className="text-gray-500">
                Try adjusting your filters to see more results
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="group relative bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-3xl p-8 cursor-pointer 
                           hover:border-[var(--color-primary)] hover:shadow-2xl transition-all duration-300 ease-in-out
                           hover:scale-[1.01]"
                  onClick={() => navigate(`/jobs/view/${job.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-gray-200 
                                     flex items-center justify-center shadow-lg overflow-hidden p-2">
                          <img 
                            src={logo2} 
                            alt="DocSpace Logo" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition duration-300">
                            {job.title}
                          </h3>
                          {job.hospital && (
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-sm font-medium text-gray-700">
                                {job.hospital.name}
                              </span>
                              {job.hospital.city && (
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm">location_on</span>
                                  {job.hospital.city}
                                  {job.hospital.state && `, ${job.hospital.state}`}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-5 py-2.5 bg-[var(--color-accent)] text-[var(--color-primary-dark)] rounded-2xl font-semibold text-sm shadow-md">
                        View Details
                      </span>
                      <span className="text-2xl group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* INPUT COMPONENT */
function Input({ label, value, onChange, placeholder, type = "text", icon }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
        {icon && (typeof icon === 'string' ? <span>{icon}</span> : icon)}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-2xl transition-all duration-300
                   focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20
                   bg-gray-50 focus:bg-white hover:border-gray-300"
      />
    </div>
  );
}

/* SELECT COMPONENT */
function Select({ label, value, onChange, options, icon }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
        {icon && (typeof icon === 'string' ? <span>{icon}</span> : icon)}
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-2xl transition-all duration-300
                   focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20
                   bg-gray-50 focus:bg-white hover:border-gray-300 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
