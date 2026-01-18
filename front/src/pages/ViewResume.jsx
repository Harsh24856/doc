import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";
import StatusBadge from "../components/StatusBadge";
import Footer from "../components/Footer";

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
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-md w-full animate-modalFadeIn">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Approve Verification
        </h2>
        <p className="text-gray-600 mb-6 text-sm">
          Please select the effective start date for <span className="font-semibold">{userName}</span>.
        </p>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="input-field"
            required
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !date}
            className="btn-primary"
          >
            {loading ? "Approving..." : "Confirm Approval"}
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
           <p className="text-gray-500 font-medium">Loading resume...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <div className="text-center p-8">
            <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">error</span>
            <p className="text-red-500 font-medium">{error}</p>
            <button
               onClick={() => navigate(-1)}
               className="mt-4 btn-secondary"
            >
               Go Back
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-grow py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white text-3xl font-bold shadow-md shrink-0">
                  {data.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
                  <p className="text-gray-600">
                    {data.designation || "Doctor"} • {data.specialization || "Medical"}
                  </p>
                  <div className="mt-3">
                     <StatusBadge status={data.verification_status} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
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
                <div className="grid sm:grid-cols-2 gap-4">
                  <Detail label="Name" value={data.name} />
                  <Detail label="Email" value={data.email} />
                  <Detail label="Phone" value={data.phone} />
                  <Detail label="Role" value={data.role} capitalize />
                </div>
              </Section>

              {/* Professional Information */}
              <Section title="Professional Information">
                <div className="grid sm:grid-cols-2 gap-4">
                   <Detail label="Designation" value={data.designation} />
                   <Detail label="Specialization" value={data.specialization} />
                   <Detail label="Hospital Affiliation" value={data.hospital_affiliation} />
                   <Detail label="Years of Experience" value={data.years_of_experience ? `${data.years_of_experience} years` : "-"} />
                   <Detail label="Year of Graduation" value={data.year_of_graduation || "-"} />
                </div>
              </Section>

              {/* Registration Details */}
              {(data.registration_number || data.registration_council) && (
                <Section title="Registration Details">
                  <div className="grid sm:grid-cols-2 gap-4">
                     <Detail label="Registration Number" value={data.registration_number} />
                     <Detail label="Registration Council" value={data.registration_council} />
                  </div>
                </Section>
              )}

              {/* Qualifications */}
              {data.qualifications && (
                <Section title="Qualifications">
                  <div className="text-gray-700 text-sm">
                    {Array.isArray(data.qualifications) ? (
                      <ul className="list-disc list-inside space-y-1 ml-1">
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
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                        {data.skills}
                      </span>
                    )}
                  </div>
                </Section>
              )}

              {/* Bio */}
              {data.bio && (
                <Section title="About">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                    {data.bio}
                  </p>
                </Section>
              )}
            </div>

            {/* Right Column - Documents */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                 <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--color-primary)]">folder_open</span>
                    Documents
                 </h2>

                {/* License Document */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    Medical License
                  </h4>
                  {data.license_doc_url ? (
                     <div className="group relative">
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 aspect-[3/4] relative">
                           {(data.verification_status === "verified" || data.verification_status === "approved") && (
                              <div className="absolute top-2 right-2 z-10 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold shadow flex items-center gap-1">
                                 <span className="material-symbols-outlined text-[14px]">verified</span>
                                 Verified
                              </div>
                           )}
                           <iframe
                              src={data.license_doc_url}
                              className="w-full h-full"
                              title="Medical License"
                           />
                           <a
                              href={data.license_doc_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              <span className="text-white font-medium flex items-center gap-2">
                                 <span className="material-symbols-outlined">open_in_new</span>
                                 Open
                              </span>
                           </a>
                        </div>
                     </div>
                  ) : (
                     <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center text-gray-400 text-sm">
                        No license uploaded
                     </div>
                  )}
                </div>

                {/* ID Document */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    ID Document
                  </h4>
                  {data.id_doc_url ? (
                     <div className="group relative">
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 aspect-[3/4] relative">
                           <iframe
                              src={data.id_doc_url}
                              className="w-full h-full"
                              title="ID Document"
                           />
                           <a
                              href={data.id_doc_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              <span className="text-white font-medium flex items-center gap-2">
                                 <span className="material-symbols-outlined">open_in_new</span>
                                 Open
                              </span>
                           </a>
                        </div>
                     </div>
                  ) : (
                     <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center text-gray-400 text-sm">
                        No ID uploaded
                     </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Detail({ label, value, capitalize }) {
  return (
    <div className="mb-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-gray-900 font-medium ${capitalize ? 'capitalize' : ''} break-words`}>
         {value || "—"}
      </p>
    </div>
  );
}
