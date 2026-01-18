import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";
import logo2 from "../assets/2.png";
import Footer from "../components/Footer";

export default function SearchJob() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortPriority, setSortPriority] = useState([]);

  /* FILTER STATE */
  const [filters, setFilters] = useState({
    department: "",
    job_type: "",
    experience: "",
    min_salary: "",
    max_salary: "",
    city: "",
  });

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));

    const sortableFields = ["experience", "min_salary", "max_salary", "city"];
    if (!sortableFields.includes(key)) return;

    setSortPriority((prev) => {
      if (!value) return prev.filter((k) => k !== key);
      if (prev.includes(key)) return prev;
      return [...prev, key];
    });
  };

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
        if (sortPriority.length > 0) {
          params.append("sort_order", sortPriority.join(","));
        }

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

    const timeout = setTimeout(fetchJobs, 400);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [filters, sortPriority]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* HEADER SECTION */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Find Your Next Role
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore career opportunities at top hospitals and clinics.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* FILTERS SIDEBAR */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--color-primary)]">tune</span>
                    Filters
                  </h2>
                  <button
                    onClick={() => {
                      setFilters({
                        department: "",
                        job_type: "",
                        experience: "",
                        min_salary: "",
                        max_salary: "",
                        city: "",
                      });
                      setSortPriority([]);
                    }}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Reset
                  </button>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Department"
                    value={filters.department}
                    onChange={(v) => updateFilter("department", v)}
                    placeholder="e.g. Nursing"
                    icon="local_hospital"
                  />

                  <Input
                    label="City"
                    value={filters.city}
                    onChange={(v) => updateFilter("city", v)}
                    placeholder="e.g. Mumbai"
                    icon="location_on"
                  />

                  <Select
                    label="Job Type"
                    value={filters.job_type}
                    onChange={(v) => updateFilter("job_type", v)}
                    options={[
                      { label: "Any Type", value: "" },
                      { label: "Full Time", value: "full-time" },
                      { label: "Part Time", value: "part-time" },
                      { label: "Contract", value: "contract" },
                    ]}
                    icon="work"
                  />

                  <Input
                    label="Min Experience (Years)"
                    value={filters.experience}
                    onChange={(v) => updateFilter("experience", v)}
                    placeholder="e.g. 2"
                    icon="star"
                    type="number"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Min Salary"
                      value={filters.min_salary}
                      onChange={(v) => updateFilter("min_salary", v)}
                      placeholder="₹"
                      type="number"
                    />
                     <Input
                      label="Max Salary"
                      value={filters.max_salary}
                      onChange={(v) => updateFilter("max_salary", v)}
                      placeholder="₹"
                      type="number"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RESULTS SECTION */}
            <div className="lg:col-span-3">
               <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  {loading ? "Searching..." : `${jobs.length} jobs found`}
                </h2>
              </div>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined">error</span>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm h-48 animate-pulse">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                        <div className="flex-1 space-y-3 py-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4 mt-4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl text-gray-400">work_off</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No jobs found</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Try adjusting your filters or search for something else.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => navigate(`/jobs/view/${job.id}`)}
                      className="group bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row gap-5"
                    >
                       <div className="shrink-0">
                        <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-2">
                          <img 
                            src={logo2} 
                            alt="Logo"
                            className="w-full h-full object-contain opacity-80"
                          />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">
                              {job.title}
                            </h3>
                            <p className="text-sm text-gray-600 font-medium mt-1">
                              {job.hospital?.name || "Unknown Hospital"}
                            </p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {job.job_type ? job.job_type.replace("-", " ") : "Full Time"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm text-gray-500">
                          {job.department && (
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[18px]">medical_services</span>
                              <span>{job.department}</span>
                            </div>
                          )}
                          {job.hospital?.city && (
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[18px]">location_on</span>
                              <span>{job.hospital.city}</span>
                            </div>
                          )}
                           {(job.min_salary || job.max_salary) && (
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[18px]">payments</span>
                              <span>
                                {job.min_salary ? `₹${job.min_salary.toLocaleString()}` : ""}
                                {job.min_salary && job.max_salary ? " - " : ""}
                                {job.max_salary ? `₹${job.max_salary.toLocaleString()}` : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end sm:justify-center sm:self-center">
                         <span className="px-4 py-2 bg-[var(--color-secondary)] text-[var(--color-primary)] rounded-lg text-sm font-semibold group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                           View Details
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

/* INPUT COMPONENT */
function Input({ label, value, onChange, placeholder, type = "text", icon }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] focus:bg-white transition-all pl-9"
        />
        {icon && (
          <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[18px] text-gray-400">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

/* SELECT COMPONENT */
function Select({ label, value, onChange, options, icon }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] focus:bg-white transition-all pl-9 appearance-none cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {icon && (
          <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[18px] text-gray-400">
            {icon}
          </span>
        )}
        <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-[18px] text-gray-400 pointer-events-none">
          expand_more
        </span>
      </div>
    </div>
  );
}
