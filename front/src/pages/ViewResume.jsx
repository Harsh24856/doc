import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

// Date Input Modal Component
function DateInputModal({ isOpen, onClose, onConfirm, userName }) {
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set minimum date to today
      const today = new Date().toISOString().split("T")[0];
      setDate(today);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!date) {
      alert("Please select a date");
      return;
    }

    setLoading(true);
    try {
      await onConfirm(date);
      setDate("");
      onClose();
    } catch (err) {
      alert(err.message || "Failed to approve resume");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 md:p-8 max-w-md w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
          Approve Resume
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          Select the start date for <span className="font-semibold">{userName}</span>
        </p>

        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-[var(--color-primary)] focus:outline-none transition"
            required
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50 text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !date}
            className="flex-1 px-4 py-2.5 sm:py-3 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? "Approving..." : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ViewResume() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDateModal, setShowDateModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isHospital, setIsHospital] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    // Check if current user is a hospital
    if (user && user.role === "hospital") {
      setIsHospital(true);
      setCurrentUser(user);
    }
    
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

  const handleApprove = async (startDate) => {
    const token = localStorage.getItem("token");
    setProcessing(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/resume/approve/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ start_date: startDate }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to approve resume");
      }

      alert(`Resume approved successfully! Start date: ${result.start_date}`);
      setShowDateModal(false);
      // Refresh data to show updated status
      window.location.reload();
    } catch (err) {
      alert(err.message || "Failed to approve resume");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm(`Are you sure you want to reject ${data?.name || "this user"}'s resume?`)) {
      return;
    }

    const token = localStorage.getItem("token");
    setProcessing(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/resume/reject/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to reject resume");
      }

      alert("Resume rejected successfully");
      // Refresh data to show updated status
      window.location.reload();
    } catch (err) {
      alert(err.message || "Failed to reject resume");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl sm:text-5xl text-gray-400 mb-3 sm:mb-4 block animate-spin">hourglass_empty</span>
          <p className="text-sm sm:text-base text-gray-500">Loading resume...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <p className="text-sm sm:text-base text-red-500 mb-4 break-words">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] text-sm sm:text-base transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-10 px-3 sm:px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xl sm:text-2xl md:text-3xl font-bold flex-shrink-0">
                {data.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 break-words">{data.name}</h1>
                <p className="text-sm sm:text-base text-gray-600 break-words">
                  {data.designation || "Doctor"} • {data.specialization || "Medical"}
                </p>
                {/* Status Badge */}
                <div className="mt-2 sm:mt-3">
                  {data.verification_status === "approved" && (
                    <span className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 bg-green-100 text-green-800 text-xs sm:text-sm font-semibold rounded-full border border-green-200">
                      <span className="material-symbols-outlined text-xs sm:text-sm">check_circle</span>
                      Verified
                    </span>
                  )}
                  {data.verification_status === "rejected" && (
                    <span className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 bg-red-100 text-red-800 text-xs sm:text-sm font-semibold rounded-full border border-red-200">
                      <span className="material-symbols-outlined text-xs sm:text-sm">cancel</span>
                      Rejected
                    </span>
                  )}
                  {(data.verification_status === "pending" || data.verification_status === "not_submitted" || !data.verification_status) && (
                    <span className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 bg-yellow-100 text-yellow-800 text-xs sm:text-sm font-semibold rounded-full border border-yellow-200">
                      <span className="material-symbols-outlined text-xs sm:text-sm">schedule</span>
                      {data.verification_status === "not_submitted" ? "Not Submitted" : "Pending"}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              {isHospital && (
                <>
                  {data.verification_status !== "approved" && (
                    <button
                      onClick={() => setShowDateModal(true)}
                      disabled={processing}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg sm:rounded-xl hover:bg-green-700 transition font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span className="hidden sm:inline">Approve Resume</span>
                      <span className="sm:hidden">Approve</span>
                    </button>
                  )}
                  {data.verification_status !== "rejected" && (
                    <button
                      onClick={handleReject}
                      disabled={processing || data.verification_status === "approved"}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-red-600 text-white rounded-lg sm:rounded-xl hover:bg-red-700 transition font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span>
                      <span className="hidden sm:inline">Reject Resume</span>
                      <span className="sm:hidden">Reject</span>
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-300 transition flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Resume Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
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
                <div className="text-gray-800 text-sm sm:text-base">
                  {Array.isArray(data.qualifications) ? (
                    <ul className="list-disc list-inside space-y-1 sm:space-y-2">
                      {data.qualifications.map((q, idx) => (
                        <li key={idx} className="break-words">{q}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="break-words">{data.qualifications}</p>
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
                        className="px-2 sm:px-3 py-1 bg-[var(--color-accent)] text-[var(--color-primary-dark)] rounded-full text-xs sm:text-sm"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
                      {data.skills}
                    </span>
                  )}
                </div>
              </Section>
            )}

            {/* Bio */}
            {data.bio && (
              <Section title="About">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line break-words">
                  {data.bio}
                </p>
              </Section>
            )}
          </div>

          {/* Right Column - Documents */}
          <div className="space-y-4 sm:space-y-6">
            <Section title="Documents">
              {/* License Document */}
              {data.license_doc_url ? (
                <div className="mb-4">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base sm:text-lg">description</span>
                    Medical License
                  </h4>
                  <div className="border-2 border-gray-200 rounded-lg sm:rounded-xl overflow-hidden relative">
                    {/* NMC Verification Overlay - Only show if verified */}
                    {(data.verification_status === "verified" || data.verification_status === "approved") && (
                      <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 z-10 bg-blue-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs font-bold shadow-lg flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs sm:text-sm">verified</span>
                        <span className="hidden sm:inline">Verified by NMC</span>
                        <span className="sm:hidden">NMC</span>
                      </div>
                    )}
                    <iframe
                      src={data.license_doc_url}
                      className="w-full h-64 sm:h-80 md:h-96"
                      title="Medical License"
                    />
                  </div>
                  <a
                    href={data.license_doc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs sm:text-sm text-[var(--color-primary)] hover:underline"
                  >
                    <span className="material-symbols-outlined text-xs sm:text-sm">open_in_new</span>
                    Open in new tab
                  </a>
                </div>
              ) : (
                <div className="mb-4 p-3 sm:p-4 bg-gray-100 rounded-lg text-center text-gray-500 text-xs sm:text-sm">
                  No license document available
                </div>
              )}

              {/* ID Document */}
              {data.id_doc_url ? (
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base sm:text-lg">badge</span>
                    ID Document
                  </h4>
                  <div className="border-2 border-gray-200 rounded-lg sm:rounded-xl overflow-hidden relative">
                    {/* NMC Verification Overlay - Only show if verified */}
                    {(data.verification_status === "verified" || data.verification_status === "approved") && (
                      <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 z-10 bg-blue-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs font-bold shadow-lg flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs sm:text-sm">verified</span>
                        <span className="hidden sm:inline">Verified by NMC</span>
                        <span className="sm:hidden">NMC</span>
                      </div>
                    )}
                    <iframe
                      src={data.id_doc_url}
                      className="w-full h-64 sm:h-80 md:h-96"
                      title="ID Document"
                    />
                  </div>
                  <a
                    href={data.id_doc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs sm:text-sm text-[var(--color-primary)] hover:underline"
                  >
                    <span className="material-symbols-outlined text-xs sm:text-sm">open_in_new</span>
                    Open in new tab
                  </a>
                </div>
              ) : (
                <div className="p-3 sm:p-4 bg-gray-100 rounded-lg text-center text-gray-500 text-xs sm:text-sm">
                  No ID document available
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>

      {/* Date Input Modal */}
      <DateInputModal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
        onConfirm={handleApprove}
        userName={data?.name || "User"}
      />
    </div>
  );
}

/* ================= UI HELPERS ================= */

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-5 md:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="mb-3 sm:mb-4">
      <p className="text-xs sm:text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-sm sm:text-base text-gray-800 font-medium break-words">{value || "-"}</p>
    </div>
  );
}

