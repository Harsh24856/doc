import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API_BASE_URL from "../config/api.js";

export default function AdminHospitalData() {
  const { hospitalId } = useParams();
  const token = localStorage.getItem("token");

  const [hospital, setHospital] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [aiInsights, setAiInsights] = useState({});
  const [aiLoading, setAiLoading] = useState(null);
  const [aiError, setAiError] = useState("");
 
  const [statusLoading, setStatusLoading] = useState(false); //Setting verification status
  const [statusError, setStatusError] = useState("");

  /* Fetch hospital data */
  useEffect(() => {
    const fetchHospitalData = async () => {
      try {
        const profileRes = await fetch(
          `${API_BASE_URL}/admin/hospitals/${hospitalId}/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const profileData = await profileRes.json();
        if (!profileRes.ok) {
          throw new Error(profileData.message || "Failed to fetch hospital profile");
        }

        setHospital(profileData.hospital);

        const docsRes = await fetch(
          `${API_BASE_URL}/admin/hospitals/${hospitalId}/documents`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const docsData = await docsRes.json();
        if (!docsRes.ok) {
          throw new Error(docsData.message || "Failed to fetch documents");
        }

        setDocuments(docsData.documents || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalData();
  }, [hospitalId, token]);

  /*  Fetch AI insights */
  const fetchAIInsights = async (documentType) => {
    try {
      setAiError("");
      setAiLoading(documentType);

      const res = await fetch(
        `${API_BASE_URL}/admin/hospitals/${hospitalId}/documents/${documentType}/insights`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch AI insights");
      }

      setAiInsights((prev) => ({
        ...prev,
        [documentType]: data.insights,
      }));
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(null);
    }
  };

  const verifyHospital = async () => {
  try {
    setStatusError("");
    setStatusLoading(true);

    const res = await fetch(
      `${API_BASE_URL}/admin/hospitals/${hospitalId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "verified" }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to verify hospital");
    }

    // Update local state so UI refreshes instantly
    setHospital((prev) => ({
      ...prev,
      verification_status: "verified",
    }));
  } catch (err) {
    setStatusError(err.message);
  } finally {
    setStatusLoading(false);
  }
};


  /* UI states  */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading hospital data…
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

  if (!hospital) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Hospital not found
      </div>
    );
  }

  /* Main UI */
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Hospital Profile */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {hospital.hospital_name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <ProfileItem label="Hospital Type" value={hospital.hospital_type} />
            <ProfileItem label="Registration Number" value={hospital.registration_number_hospital} />
            <ProfileItem label="City" value={hospital.hospital_city} />
            <ProfileItem label="State" value={hospital.hospital_state} />
            <ProfileItem label="Contact Person" value={hospital.hospital_person_name} />
            <ProfileItem label="Contact Email" value={hospital.hospital_person_email} />
            <ProfileItem label="Website" value={hospital.hospital_website} />
            <div className="md:col-span-2">
                <p className="text-gray-500">Verification Status</p>

                <div className="flex items-center gap-4 mt-1">
                  <span className="font-medium text-gray-800 capitalize">
                    {hospital.verification_status}
                  </span>

                  {hospital.verification_status !== "verified" && (
                  <button
                  onClick={verifyHospital}
                  disabled={statusLoading}
                  className="px-4 py-1.5 rounded-md text-sm font-medium
                   bg-green-600 text-white hover:bg-green-700
                   disabled:bg-gray-400"
                  >
                   {statusLoading ? "Verifying…" : "Verify Hospital"}
                  </button>
                  )}
                 </div>

                 {statusError && (
                  <p className="mt-2 text-sm text-red-600">{statusError}</p>
                 )}
             </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Submitted Documents
          </h3>

          {documents.length === 0 ? (
            <p className="text-gray-500">No documents uploaded</p>
          ) : (
            <ul className="space-y-4">
              {documents.map((doc) => (
                <li
                  key={doc.document_type}
                  className="border rounded-lg px-4 py-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize text-sm font-medium text-gray-700">
                      {doc.document_type}
                    </span>

                    <div className="flex gap-4">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm font-medium hover:underline"
                      >
                        View PDF
                      </a>

                      <button
                        onClick={() => fetchAIInsights(doc.document_type)}
                        disabled={aiLoading === doc.document_type}
                        className="text-sm font-medium text-purple-600 hover:underline disabled:text-gray-400"
                      >
                        {aiLoading === doc.document_type
                          ? "Analyzing…"
                          : "AI Insights"}
                      </button>
                    </div>
                  </div>

                  {aiInsights[doc.document_type] && (
                    <AISummary insights={aiInsights[doc.document_type]} />
                  )}
                </li>
              ))}
            </ul>
          )}

          {aiError && (
            <p className="mt-4 text-sm text-red-600">{aiError}</p>
          )}
        </div>

      </div>
    </div>
  );
}

/* Helper components */

function ProfileItem({ label, value }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value || "—"}</p>
    </div>
  );
}

function AISummary({ insights }) {
  return (
    <div className="bg-gray-50 border rounded-lg p-4 text-sm space-y-3">
      <p className="font-semibold text-gray-700">AI Insights (Assistive)</p>

      <div>
        <p className="text-gray-500">Extracted Fields</p>
        <ul className="list-disc list-inside">
          {Object.entries(insights.extracted_fields).map(([key, value]) => (
            <li key={key}>
              <span className="capitalize">
                {key.replace(/_/g, " ")}:
              </span>{" "}
              {value || "—"}
            </li>
          ))}
        </ul>
      </div>

      {insights.observations?.length > 0 && (
        <div>
          <p className="text-gray-500">Observations</p>
          <ul className="list-disc list-inside text-yellow-700">
            {insights.observations.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
      )}

      {insights.risk_flags?.length > 0 && (
        <div>
          <p className="text-gray-500">Risk Flags</p>
          <ul className="list-disc list-inside text-red-600">
            {insights.risk_flags.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-gray-500">
        Confidence:{" "}
        <span className="font-medium text-gray-800">
          {insights.confidence}
        </span>
      </p>
    </div>
  );
}
