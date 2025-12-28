import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";
import logo2 from "../assets/2.png";

export default function AdminHospitalData() {
  const navigate = useNavigate();
  const { hospitalId } = useParams();
  const token = localStorage.getItem("token");

  const [hospital, setHospital] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [aiInsights, setAiInsights] = useState({});
  const [aiLoading, setAiLoading] = useState(null);
  const [aiError, setAiError] = useState("");
 
  const [statusAction, setStatusAction] = useState(null); 
  // "verify" | "reject" | null
 //Setting verification status
  const [statusError, setStatusError] = useState("");

  const rejectHospital = async () => {
  try {
    setStatusError("");
    setStatusAction("reject");

    const res = await fetch(
      `${API_BASE_URL}/admin/hospitals/${hospitalId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
         status: "rejected",
         reason: rejectReason || null
       }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to reject hospital");

    setHospital((prev) => ({
      ...prev,
      verification_status: "rejected",
    }));
  } catch (err) {
    setStatusError(err.message);
  } finally {
    setStatusAction(null);
    setShowRejectModal(false);
    setRejectReason("");
  }
};



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
    setStatusAction("verify");

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
    if (!res.ok) throw new Error(data.message || "Failed to verify hospital");

    setHospital((prev) => ({
      ...prev,
      verification_status: "verified",
    }));
  } catch (err) {
    setStatusError(err.message);
  } finally {
    setStatusAction(null);
  }
};



  /* UI states  */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading hospital data…</p>
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

  if (!hospital) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center px-4">
          <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">local_hospital</span>
          <p className="text-gray-500 text-lg font-semibold">Hospital not found</p>
        </div>
      </div>
    );
  }

  /* Main UI */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8 text-center">
          <img 
            src={logo2} 
            alt="DocSpace Logo" 
            className="h-16 sm:h-24 md:h-32 w-auto mx-auto mb-4 sm:mb-6 object-contain"
          />
          <div className="flex items-center justify-center gap-3 mb-2">
            <button
              onClick={() => navigate("/admin-hospital")}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-[var(--color-primary)] transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="text-sm sm:text-base">Back to Hospitals</span>
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Hospital Details
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Review and verify hospital information
          </p>
        </div>

        {/* Hospital Profile */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8">
          <div className="flex items-start justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white shadow-lg shrink-0">
                <span className="material-symbols-outlined text-3xl sm:text-4xl">local_hospital</span>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                  {hospital.hospital_name}
                </h2>
                <p className="text-sm sm:text-base text-gray-500">
                  {hospital.hospital_city}, {hospital.hospital_state}
                </p>
              </div>
            </div>
            {hospital.verification_status === "verified" && (
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">verified</span>
                Verified
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <ProfileItem label="Hospital Type" value={hospital.hospital_type} icon="category" />
            <ProfileItem label="Registration Number" value={hospital.registration_number_hospital} icon="badge" />
            <ProfileItem label="City" value={hospital.hospital_city} icon="location_on" />
            <ProfileItem label="State" value={hospital.hospital_state} icon="map" />
            <ProfileItem label="Contact Person" value={hospital.hospital_person_name} icon="person" />
            <ProfileItem label="Contact Email" value={hospital.hospital_person_email} icon="email" />
            {hospital.hospital_website && (
              <ProfileItem label="Website" value={hospital.hospital_website} icon="language" isLink />
            )}
          </div>

          {/* Verification Status */}
          <div className="border-t-2 border-gray-200 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm sm:text-base text-gray-500 mb-2">Verification Status</p>
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm sm:text-base capitalize ${
                  hospital.verification_status === "verified" 
                    ? "bg-green-100 text-green-700" 
                    : hospital.verification_status === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  <span className="material-symbols-outlined text-lg">
                    {hospital.verification_status === "verified" ? "check_circle" : "pending"}
                  </span>
                  {hospital.verification_status}
                </span>
              </div>

              {hospital.verification_status === "pending" && (
  <div className="flex flex-col sm:flex-row gap-3">
    {/* VERIFY */}
    <button
  onClick={verifyHospital}
  disabled={statusAction !== null}
  className="flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 hover:shadow-lg transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
>
  <span className="material-symbols-outlined text-lg">
    {statusAction === "verify" ? "hourglass_empty" : "verified"}
  </span>
  {statusAction === "verify" ? "Verifying…" : "Verify Hospital"}
</button>


    {/* REJECT */}
    <button
  onClick={() => setShowRejectModal(true)}
  disabled={statusAction !== null}
  className="flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 hover:shadow-lg transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
>
  <span className="material-symbols-outlined text-lg">
    {statusAction === "reject" ? "hourglass_empty" : "cancel"}
  </span>
  {statusAction === "reject" ? "Rejecting…" : "Reject Hospital"}
</button>
   
  </div>
)}

            </div>

            {statusError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">error</span>
                  {statusError}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl sm:text-3xl text-[var(--color-primary)]">description</span>
              Submitted Documents
            </h3>
            {documents.length > 0 && (
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--color-primary)] text-white rounded-full text-xs sm:text-sm font-semibold">
                {documents.length} Document{documents.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <span className="material-symbols-outlined text-6xl sm:text-7xl text-gray-300 mb-4">description</span>
              <p className="text-lg sm:text-xl text-gray-500 font-medium">No documents uploaded</p>
              <p className="text-sm sm:text-base text-gray-400 mt-2">This hospital has not submitted any documents yet</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {documents.map((doc) => (
                <div
                  key={doc.document_type}
                  className="border-2 border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                        <span className="material-symbols-outlined text-2xl sm:text-3xl">description</span>
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-gray-900 capitalize">
                          {doc.document_type.replace(/_/g, ' ')}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-500">Document file</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-[var(--color-accent)] text-[var(--color-primary-dark)] rounded-lg font-semibold text-sm hover:bg-[var(--color-primary)] hover:text-white transition-all duration-300"
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                        View PDF
                      </a>

                      <button
                        onClick={() => fetchAIInsights(doc.document_type)}
                        disabled={aiLoading === doc.document_type}
                        className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-purple-100 text-purple-700 rounded-lg font-semibold text-sm hover:bg-purple-600 hover:text-white transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {aiLoading === doc.document_type ? "hourglass_empty" : "auto_awesome"}
                        </span>
                        {aiLoading === doc.document_type ? "Analyzing…" : "AI Insights"}
                      </button>
                    </div>
                  </div>

                  {aiInsights[doc.document_type] && (
                    <div className="mt-4 pt-4 border-t-2 border-gray-200">
                      <AISummary insights={aiInsights[doc.document_type]} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {aiError && (
            <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {aiError}
              </p>
            </div>
          )}
        </div>
       {showRejectModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
  <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-gray-200 animate-scaleIn">
    
    {/* Header */}
    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
      Reject Hospital
    </h3>
    <p className="text-sm text-gray-500 mb-5">
      You may optionally include a reason. This message will be visible to the hospital.
    </p>

    {/* Textarea */}
    <textarea
      value={rejectReason}
      onChange={(e) => setRejectReason(e.target.value)}
      rows={4}
      placeholder="Reason for rejection (optional)"
      className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition mb-6"
    />

    {/* Actions */}
    <div className="flex justify-end gap-3">
      <button
        onClick={() => {
          setShowRejectModal(false);
          setRejectReason("");
        }}
        className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
      >
        Cancel
      </button>

      <button
        onClick={rejectHospital}
        className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition shadow-sm"
      >
        Confirm Reject
      </button>
    </div>

  </div>
</div>
)}
      </div>
    </div>
  );
}

/* Helper components */

function ProfileItem({ label, value, icon, isLink = false }) {
  if (!value || value === "—") {
    return (
      <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-gray-50">
        <span className="material-symbols-outlined text-gray-400 text-xl sm:text-2xl shrink-0">{icon || "info"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-sm sm:text-base font-semibold text-gray-400">—</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:shadow-md transition-all duration-300">
      <span className="material-symbols-outlined text-[var(--color-primary)] text-xl sm:text-2xl shrink-0">{icon || "info"}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-gray-500 mb-1">{label}</p>
        {isLink ? (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm sm:text-base font-semibold text-[var(--color-primary)] hover:underline break-all"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">{value}</p>
        )}
      </div>
    </div>
  );
}

function AISummary({ insights }) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-2xl sm:text-3xl text-purple-600">auto_awesome</span>
        <h4 className="text-lg sm:text-xl font-bold text-purple-900">AI Insights (Assistive)</h4>
      </div>

      {insights.extracted_fields && Object.keys(insights.extracted_fields).length > 0 && (
        <div className="bg-white rounded-lg p-4 sm:p-5 border border-purple-200">
          <p className="text-sm sm:text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">checklist</span>
            Extracted Fields
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(insights.extracted_fields).map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="material-symbols-outlined text-gray-400 text-sm shrink-0">check_circle</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/_/g, " ")}:
                  </p>
                  <p className="text-xs sm:text-sm text-gray-900 break-words">{value || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {insights.observations?.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 sm:p-5">
          <p className="text-sm sm:text-base font-semibold text-yellow-800 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">warning</span>
            Observations
          </p>
          <ul className="space-y-2">
            {insights.observations.map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-sm sm:text-base text-yellow-700">
                <span className="material-symbols-outlined text-lg shrink-0">info</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {insights.risk_flags?.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 sm:p-5">
          <p className="text-sm sm:text-base font-semibold text-red-800 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">flag</span>
            Risk Flags
          </p>
          <ul className="space-y-2">
            {insights.risk_flags.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm sm:text-base text-red-700">
                <span className="material-symbols-outlined text-lg shrink-0">error</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {insights.confidence && (
        <div className="bg-white rounded-lg p-4 sm:p-5 border border-purple-200">
          <p className="text-sm sm:text-base text-gray-600 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">trending_up</span>
              Confidence Score:
            </span>
            <span className="font-bold text-lg sm:text-xl text-[var(--color-primary)]">
              {insights.confidence}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
