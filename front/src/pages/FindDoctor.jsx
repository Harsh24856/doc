import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";
import logo2 from "../assets/2.png";
import StatusBadge from "../components/StatusBadge";
import Footer from "../components/Footer";

export default function FindDoctor() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* FILTER STATE */
  const [filters, setFilters] = useState({
    name: "",
    department: "",
    council: "",
    registration_number: "",
  });

  /* AUTO SEARCH EFFECT */
  useEffect(() => {
    const controller = new AbortController();

    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });

        // Only search if at least one filter is provided
        if (params.toString().length === 0) {
          setDoctors([]);
          setLoading(false);
          return;
        }

        const url = `${API_BASE_URL}/search/doctors?${params.toString()}`;

        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch doctors");
        }

        setDoctors(data.doctors || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    /* debounce */
    const timeout = setTimeout(fetchDoctors, 400);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [filters]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* HEADER SECTION */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Find Verified Doctors
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Search the official registry of verified healthcare professionals.
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
                  {(filters.name || filters.department || filters.council || filters.registration_number) && (
                    <button
                      onClick={() =>
                        setFilters({
                          name: "",
                          department: "",
                          council: "",
                          registration_number: "",
                        })
                      }
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <Input
                    label="Doctor Name"
                    value={filters.name}
                    onChange={(v) => setFilters({ ...filters, name: v })}
                    placeholder="e.g. Dr. John Smith"
                  />

                  <Input
                    label="Specialization"
                    value={filters.department}
                    onChange={(v) => setFilters({ ...filters, department: v })}
                    placeholder="e.g. Cardiology"
                  />

                  <Input
                    label="Council"
                    value={filters.council}
                    onChange={(v) => setFilters({ ...filters, council: v })}
                    placeholder="e.g. MCI"
                  />

                  <Input
                    label="Registration No."
                    value={filters.registration_number}
                    onChange={(v) => setFilters({ ...filters, registration_number: v })}
                    placeholder="e.g. 12345"
                  />
                </div>
              </div>
            </div>

            {/* RESULTS SECTION */}
            <div className="lg:col-span-3">
              {/* STATUS BAR */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  {loading ? "Searching..." : `${doctors.length} results found`}
                </h2>
              </div>

              {/* ERROR */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined">error</span>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {/* RESULTS LIST */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm h-48 animate-pulse">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-3 py-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : doctors.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl text-gray-400">search_off</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No doctors found</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Try adjusting your filters or search for something else.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      onClick={() => navigate(`/profile/${doctor.id}`)}
                      className="group bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row gap-5"
                    >
                      {/* Avatar */}
                      <div className="shrink-0">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white text-2xl font-bold shadow-sm group-hover:scale-105 transition-transform">
                          {doctor.name?.charAt(0) || "D"}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">
                              {doctor.name}
                            </h3>
                            <p className="text-sm text-gray-600 font-medium">
                              {doctor.specialization || "General Practitioner"}
                              {doctor.designation && ` • ${doctor.designation}`}
                            </p>
                          </div>
                          {doctor.verification_status && (
                            <StatusBadge status={doctor.verification_status} />
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-3 text-sm text-gray-500">
                          {doctor.hospital_affiliation && (
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px]">local_hospital</span>
                              <span className="truncate">{doctor.hospital_affiliation}</span>
                            </div>
                          )}
                          {doctor.registration_number && (
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px]">badge</span>
                              <span>Reg: {doctor.registration_number}</span>
                            </div>
                          )}
                          {doctor.registration_council && (
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px]">verified_user</span>
                              <span className="truncate">{doctor.registration_council}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action */}
                      <div className="flex items-center justify-end sm:justify-center sm:self-center">
                        <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all">
                          <span className="material-symbols-outlined">arrow_forward</span>
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
function Input({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] focus:bg-white transition-all"
      />
    </div>
  );
}
