import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/profile/public/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Profile not found");
        }
        return data;
      })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Profile fetch error:", err.message);
        setError(err.message || "Profile not available");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 sm:py-8 md:py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-2xl sm:text-3xl font-bold flex-shrink-0">
            {data.name?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 break-words">
                {data.name}
              </h1>
              {/* Verification Status Badge */}
              {data.verification_status === "approved" || data.verification_status === "verified" ? (
                <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 text-xs sm:text-sm font-semibold rounded-full flex items-center gap-1 w-fit">
                  <span>✓</span> Verified
                </span>
              ) : (
                <span className="px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-800 text-xs sm:text-sm font-semibold rounded-full w-fit">
                  Pending Verification
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              {data.designation || "Doctor"} • {data.specialization || "Medical"}
            </p>
            {data.hospital_affiliation && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                🏥 {data.hospital_affiliation}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate(`/resume/${id}`)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition-all text-xs sm:text-sm font-medium"
              title="View Full Resume"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="hidden sm:inline">View Resume</span>
              <span className="sm:hidden">Resume</span>
            </button>
            <button
              onClick={() => navigate(`/chat/${id}`)}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-full shadow-lg transition-all hover:scale-110 flex-shrink-0"
              title="Send Message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* BIO */}
        <Section title="About">
          <p className="text-gray-700 leading-relaxed">
            {data.bio || "No bio provided."}
          </p>
        </Section>

        {/* DETAILS */}
        <Section title="Professional Details">
          <Detail label="Specialization" value={data.specialization} />
          <Detail
            label="Qualifications"
            value={
              Array.isArray(data.qualifications)
                ? data.qualifications.join(", ")
                : "-"
            }
          />
          <Detail
            label="Skills"
            value={
              Array.isArray(data.skills)
                ? data.skills.join(", ")
                : "-"
            }
          />
        </Section>
      </div>
    </div>
  );
}

/* ================= UI HELPERS ================= */

function Section({ title, children }) {
  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">
        {title}
      </h2>
      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
        {children}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="mb-2 sm:mb-3">
      <p className="text-xs sm:text-sm text-gray-500">{label}</p>
      <p className="text-sm sm:text-base text-gray-800 font-medium">
        {value || "-"}
      </p>
    </div>
  );
}