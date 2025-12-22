import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";

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
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading verification queue…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Hospital Verification Queue
        </h2>

        {hospitals.length === 0 ? (
          <p className="text-gray-500 text-center">
            No hospitals pending verification 🎉
          </p>
        ) : (
          <ul className="divide-y">
            {hospitals.map((hospital) => (
              <li
                key={hospital.id}
                className="py-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {hospital.hospital_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {hospital.hospital_city}, {hospital.hospital_state}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Submitted on{" "}
                    {new Date(
                      hospital.verification_submitted_at
                    ).toLocaleString()}
                  </p>
                </div>

                {/* Next step: navigate to review page */}
                <button 
                onClick={() => navigate(`/admin/hospital/${hospital.id}`)}
                className="text-blue-600 font-medium hover:underline">
                  Review
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
