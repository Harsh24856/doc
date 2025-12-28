import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";
import logo2 from "../assets/2.png";

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
            Find Doctor
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            Search for verified doctors by name, department, council, or registration number
          </p>
        </div>

        {/* FILTERS CARD */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 p-4 sm:p-6 md:p-8 lg:p-10 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <span className="material-symbols-outlined text-xl sm:text-2xl text-gray-700">search</span>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Search Filters</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Input
              label="Doctor Name"
              value={filters.name}
              onChange={(v) => setFilters({ ...filters, name: v })}
              placeholder="e.g. Dr. John Smith"
              icon={<span className="material-symbols-outlined text-lg">person</span>}
            />

            <Input
              label="Department/Specialization"
              value={filters.department}
              onChange={(v) => setFilters({ ...filters, department: v })}
              placeholder="e.g. Cardiology, Neurology"
              icon={<span className="material-symbols-outlined text-lg">medical_services</span>}
            />

            <Input
              label="Registration Council"
              value={filters.council}
              onChange={(v) => setFilters({ ...filters, council: v })}
              placeholder="e.g. MCI, NMC"
              icon={<span className="material-symbols-outlined text-lg">verified</span>}
            />

            <Input
              label="Registration Number"
              value={filters.registration_number}
              onChange={(v) => setFilters({ ...filters, registration_number: v })}
              placeholder="e.g. 12345"
              icon={<span className="material-symbols-outlined text-lg">badge</span>}
            />
          </div>

          {/* RESET BUTTON */}
          <div className="flex justify-end mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={() =>
                setFilters({
                  name: "",
                  department: "",
                  council: "",
                  registration_number: "",
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
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-10">
          {/* RESULTS HEADER */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {loading ? "Searching..." : `${doctors.length} Doctor${doctors.length !== 1 ? 's' : ''} Found`}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {loading ? "Please wait..." : filters.name || filters.department || filters.council || filters.registration_number ? "Click on any doctor to view profile" : "Enter search criteria to find doctors"}
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
              <p className="text-gray-500">Searching doctors…</p>
            </div>
          ) : doctors.length === 0 && (filters.name || filters.department || filters.council || filters.registration_number) ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-6xl text-gray-400 mb-4 block">person_search</span>
              <p className="text-xl font-semibold text-gray-800 mb-2">
                No doctors found
              </p>
              <p className="text-gray-500">
                Try adjusting your search filters
              </p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-6xl text-gray-400 mb-4 block">search</span>
              <p className="text-xl font-semibold text-gray-800 mb-2">
                Start Your Search
              </p>
              <p className="text-gray-500">
                Use the filters above to search for doctors
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="group relative bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-3xl p-6 sm:p-8 cursor-pointer 
                           hover:border-[var(--color-primary)] hover:shadow-2xl transition-all duration-300 ease-in-out
                           hover:scale-[1.01]"
                  onClick={() => navigate(`/profile/${doctor.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] 
                                   flex items-center justify-center text-white shadow-lg shrink-0">
                        <span className="material-symbols-outlined text-3xl sm:text-4xl">person</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition duration-300 mb-2">
                          {doctor.name}
                        </h3>
                        {doctor.designation && (
                          <p className="text-sm sm:text-base text-gray-700 font-medium mb-1">
                            {doctor.designation}
                          </p>
                        )}
                        {doctor.specialization && (
                          <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">medical_services</span>
                            {doctor.specialization}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-3">
                          {doctor.registration_council && (
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">verified</span>
                              {doctor.registration_council}
                            </span>
                          )}
                          {doctor.registration_number && (
                            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">badge</span>
                              Reg: {doctor.registration_number}
                            </span>
                          )}
                          {doctor.verification_status === "verified" && (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              Verified
                            </span>
                          )}
                        </div>
                        {doctor.hospital_affiliation && (
                          <p className="text-sm text-gray-500 mt-3 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">local_hospital</span>
                            {doctor.hospital_affiliation}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-5 py-2.5 bg-[var(--color-accent)] text-[var(--color-primary-dark)] rounded-2xl font-semibold text-sm shadow-md">
                        View Profile
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
function Input({ label, value, onChange, placeholder, icon }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
        {icon && (typeof icon === 'string' ? <span>{icon}</span> : icon)}
        {label}
      </label>
      <input
        type="text"
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

