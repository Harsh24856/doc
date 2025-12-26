import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

export default function ViewResume() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    fetch(`${API_BASE_URL}/profile/resume/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load resume");
        }
        return data;
      })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Resume fetch error:", err.message);
        setError(err.message || "Failed to load resume");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading resume...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                {data.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{data.name}</h1>
                <p className="text-gray-600">
                  {data.designation || "Doctor"} • {data.specialization || "Medical"}
                </p>
                {data.verification_status === "approved" && (
                  <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Resume Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Section title="Personal Information">
              <Detail label="Name" value={data.name} />
              <Detail label="Email" value={data.email} />
              <Detail label="Phone" value={data.phone} />
              <Detail label="Role" value={data.role} />
            </Section>

            {/* Professional Information */}
            <Section title="Professional Information">
              <Detail label="Designation" value={data.designation} />
              <Detail label="Specialization" value={data.specialization} />
              <Detail label="Hospital Affiliation" value={data.hospital_affiliation} />
              <Detail label="Years of Experience" value={data.years_of_experience ? `${data.years_of_experience} years` : "-"} />
              <Detail label="Year of Graduation" value={data.year_of_graduation || "-"} />
            </Section>

            {/* Registration Details */}
            {(data.registration_number || data.registration_council) && (
              <Section title="Registration Details">
                <Detail label="Registration Number" value={data.registration_number} />
                <Detail label="Registration Council" value={data.registration_council} />
              </Section>
            )}

            {/* Qualifications */}
            {data.qualifications && (
              <Section title="Qualifications">
                <div className="text-gray-800">
                  {Array.isArray(data.qualifications) ? (
                    <ul className="list-disc list-inside space-y-1">
                      {data.qualifications.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{data.qualifications}</p>
                  )}
                </div>
              </Section>
            )}

            {/* Skills */}
            {data.skills && (
              <Section title="Skills">
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(data.skills) ? (
                    data.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {data.skills}
                    </span>
                  )}
                </div>
              </Section>
            )}

            {/* Bio */}
            {data.bio && (
              <Section title="About">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {data.bio}
                </p>
              </Section>
            )}
          </div>

          {/* Right Column - Documents */}
          <div className="space-y-6">
            <Section title="Documents">
              {/* License Document */}
              {data.license_doc_url ? (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Medical License
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <iframe
                      src={data.license_doc_url}
                      className="w-full h-96"
                      title="Medical License"
                    />
                  </div>
                  <a
                    href={data.license_doc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                  >
                    Open in new tab →
                  </a>
                </div>
              ) : (
                <div className="mb-4 p-4 bg-gray-100 rounded-lg text-center text-gray-500 text-sm">
                  No license document available
                </div>
              )}

              {/* ID Document */}
              {data.id_doc_url ? (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    ID Document
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <iframe
                      src={data.id_doc_url}
                      className="w-full h-96"
                      title="ID Document"
                    />
                  </div>
                  <a
                    href={data.id_doc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                  >
                    Open in new tab →
                  </a>
                </div>
              ) : (
                <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-500 text-sm">
                  No ID document available
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= UI HELPERS ================= */

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="mb-3">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-gray-800 font-medium">{value || "-"}</p>
    </div>
  );
}

