import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";
import logo1 from "../assets/1.png";
import logo2 from "../assets/2.png";

export default function AdminHospitals() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/admin/hospitals/queue`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch hospitals");
        }

        setHospitals(data.hospitals || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading verification queue…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center px-4">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
          <p className="text-red-600 text-lg font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8 text-center">
          <img 
            src={logo1} 
            alt="DocSpace Logo" 
            className="h-16 sm:h-24 md:h-32 w-auto mx-auto mb-4 sm:mb-6 object-contain"
          />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Hospital Verification Queue
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Review and verify hospital registrations
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl sm:text-3xl text-[var(--color-primary)]">local_hospital</span>
              Pending Hospitals
            </h2>
            {hospitals.length > 0 && (
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--color-primary)] text-white rounded-full text-xs sm:text-sm font-semibold">
                {hospitals.length} Pending
              </span>
            )}
          </div>

          {hospitals.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <span className="material-symbols-outlined text-6xl sm:text-7xl text-gray-300 mb-4">check_circle</span>
              <p className="text-lg sm:text-xl text-gray-500 font-medium">No hospitals pending verification 🎉</p>
              <p className="text-sm sm:text-base text-gray-400 mt-2">All hospitals have been verified</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {hospitals.map((hospital) => (
                <div
                  key={hospital.id}
                  className="border-2 border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate(`/admin/hospital/${hospital.id}`)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0">
                          <img src={logo2} alt="Hospital Logo" className="w-full h-full object-contain rounded-xl sm:rounded-2xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                            {hospital.hospital_name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-base text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-base">location_on</span>
                              {hospital.hospital_city}, {hospital.hospital_state}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            Submitted on {new Date(hospital.verification_submitted_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/hospital/${hospital.id}`);
                      }}
                      className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 hover:shadow-lg transform hover:scale-105 shrink-0 w-full sm:w-auto"
                    >
                      <span className="material-symbols-outlined text-lg">visibility</span>
                      Review
                    </button>
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
