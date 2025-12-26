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
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">

        {/* HEADER */}
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-3xl font-bold">
            {data.name?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-800">
                {data.name}
              </h1>
              {/* Verification Status Badge */}
              {data.verification_status === "approved" || data.verification_status === "approved" ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full flex items-center gap-1">
                  <span>✓</span> Verified
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
                  Pending Verification
                </span>
              )}
            </div>
            <p className="text-gray-600">
              {data.designation || "Doctor"} • {data.specialization || "Medical"}
            </p>
            {data.hospital_affiliation && (
              <p className="text-sm text-gray-500 mt-1">
                🏥 {data.hospital_affiliation}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
           
            <button
              onClick={() => navigate(`/chat/${id}`)}
              className="flex items-center justify-center w-12 h-12 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-full shadow-lg transition-all hover:scale-110"
              title="Send Message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
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
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-3">
        {title}
      </h2>
      <div className="bg-gray-50 p-4 rounded-lg">
        {children}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="mb-2">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-gray-800 font-medium">
        {value || "-"}
      </p>
    </div>
  );
}