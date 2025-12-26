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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Approve Resume
        </h2>
        <p className="text-gray-600 mb-6">
          Select the start date for <span className="font-semibold">{userName}</span>
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[var(--color-primary)] focus:outline-none transition"
            required
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !date}
            className="flex-1 px-4 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-gray-400 mb-4 block animate-spin">hourglass_empty</span>
          <p className="text-gray-500">Loading resume...</p>
        </div>
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
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)]"
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
              <div className="w-20 h-20 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-3xl font-bold">
                {data.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{data.name}</h1>
                <p className="text-gray-600">
                  {data.designation || "Doctor"} • {data.specialization || "Medical"}
                </p>
                {/* Status Badge */}
                <div className="mt-3">
                  {data.verification_status === "approved" && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-100 text-green-800 text-sm font-semibold rounded-full border border-green-200">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Verified
                    </span>
                  )}
                  {data.verification_status === "rejected" && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-100 text-red-800 text-sm font-semibold rounded-full border border-red-200">
                      <span className="material-symbols-outlined text-sm">cancel</span>
                      Rejected
                    </span>
                  )}
                  {(data.verification_status === "pending" || data.verification_status === "not_submitted" || !data.verification_status) && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full border border-yellow-200">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {data.verification_status === "not_submitted" ? "Not Submitted" : "Pending"}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isHospital && (
                <>
                  {data.verification_status !== "approved" && (
                    <button
                      onClick={() => setShowDateModal(true)}
                      disabled={processing}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Approve Resume
                    </button>
                  )}
                  {data.verification_status !== "rejected" && (
                    <button
                      onClick={handleReject}
                      disabled={processing || data.verification_status === "approved"}
                      className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span>
                      Reject Resume
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back
              </button>
            </div>
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
                        className="px-3 py-1 bg-[var(--color-accent)] text-[var(--color-primary-dark)] rounded-full text-sm"
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
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">description</span>
                    Medical License
                  </h4>
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden relative">
                    {/* NMC Verification Overlay */}
                    <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                      Verified by NMC Website
                    </div>
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
                    className="mt-2 inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    Open in new tab
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
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">badge</span>
                    ID Document
                  </h4>
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden relative">
                    {/* NMC Verification Overlay */}
                    <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                      Verified by NMC Website
                    </div>
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
                    className="mt-2 inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    Open in new tab
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

