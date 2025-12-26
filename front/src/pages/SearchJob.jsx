import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";

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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-10">

        {/* HEADER */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Job Openings
          </h2>
          <p className="text-gray-500 mt-2">
            Explore available opportunities
          </p>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

          <Input
            label="Department"
            value={filters.department}
            onChange={(v) =>
              setFilters({ ...filters, department: v })
            }
          />

          <Input
            label="Experience (years)"
            value={filters.experience}
            onChange={(v) =>
              setFilters({ ...filters, experience: v })
            }
          />

          <Select
            label="Job Type"
            value={filters.job_type}
            onChange={(v) =>
              setFilters({ ...filters, job_type: v })
            }
            options={[
              { label: "Any", value: "" },
              { label: "Full Time", value: "full-time" },
              { label: "Part Time", value: "part-time" },
              { label: "Contract", value: "contract" },
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Salary"
              value={filters.min_salary}
              onChange={(v) =>
                setFilters({ ...filters, min_salary: v })
              }
            />
            <Input
              label="Max Salary"
              value={filters.max_salary}
              onChange={(v) =>
                setFilters({ ...filters, max_salary: v })
              }
            />
          </div>

          {/* RESET */}
          <div className="md:col-span-2 flex justify-end">
            <button
              onClick={() =>
                setFilters({
                  department: "",
                  job_type: "",
                  experience: "",
                  min_salary: "",
                  max_salary: "",
                })
              }
              className="px-6 py-2 border rounded-lg text-gray-600"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        {/* RESULTS */}
        {loading ? (
          <div className="text-center text-gray-500">
            Loading jobs…
          </div>
        ) : jobs.length === 0 ? (
          <p className="text-gray-500">
            No jobs match your filters.
          </p>
        ) : (
          <ul className="space-y-4">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="flex items-center justify-between border rounded-lg px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => navigate(`/jobs/view/${job.id}`)}
              >
                <span className="text-gray-800 font-medium">
                  {job.title}
                </span>

                <span className="text-sm text-blue-600">
                  View →
                </span>
              </li>
            ))}
          </ul>
        )}

      </div>
    </div>
  );
}

/* INPUT COMPONENT */
function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg transition
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

/* SELECT COMPONENT */
function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg transition
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
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
