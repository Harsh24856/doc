import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";
import logo2 from "../assets/2.png";
import StatusBadge from "../components/StatusBadge";
import Footer from "../components/Footer";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [results, setResults] = useState({});
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectUserId, setRejectUserId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const getTokens = (str) =>
    str
      .split(" ")
      .filter(
        (w) =>
          w.length >= 3 &&                 // avoid "dr", "mr", "r"
          !["dr", "mr", "ms", "mrs"].includes(w)
      );

  const fetchPending = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/verifications/pending`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPending(data);
    } catch {
      alert("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const openDocument = async (userId, type) => {
    const res = await fetch(
      `${API_BASE_URL}/admin/verifications/${userId}/document/${type}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    const data = await res.json();
    if (data.url) window.open(data.url, "_blank");
  };

  const runAICheck = async (id) => {
    try {
      setVerifyingId(id);
      const res = await fetch(
        `${API_BASE_URL}/admin/verifications/${id}/ai-check`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults((prev) => ({ ...prev, [id]: data }));
    } catch (err) {
      alert(err.message);
    } finally {
      setVerifyingId(null);
    }
  };

  const approve = async (id) => {
    await fetch(
      `${API_BASE_URL}/admin/verifications/${id}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    fetchPending();
  };

  const reject = (id) => {
    setRejectUserId(id);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    await fetch(
      `${API_BASE_URL}/admin/verifications/${rejectUserId}/reject`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rejection_reason: rejectionReason || null,
        }),
      }
    );

    setShowRejectModal(false);
    setRejectUserId(null);
    setRejectionReason("");
    fetchPending();
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
          <p className="text-gray-500 font-medium">Loading admin dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
               <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="material-symbols-outlined text-4xl text-[var(--color-primary)]">admin_panel_settings</span>
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage doctor verifications and platform settings
              </p>
            </div>
            {pending.length > 0 && (
              <span className="px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">pending</span>
                {pending.length} Pending Actions
              </span>
            )}
          </div>

          <div className="space-y-6">
             <h2 className="text-xl font-bold text-gray-800 border-b pb-4">
               Pending Verifications
             </h2>

            {pending.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <span className="material-symbols-outlined text-4xl text-green-500">check_circle</span>
                </div>
                <p className="text-xl text-gray-800 font-bold mb-2">All Caught Up!</p>
                <p className="text-gray-500">No pending verifications at the moment.</p>
              </div>
            )}

            {pending.map((u) => {
              const result = results[u.id];
              return (
                <div key={u.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                   {/* Card Header */}
                   <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                            {u.name.charAt(0)}
                         </div>
                         <div>
                            <h3 className="text-lg font-bold text-gray-900">{u.name}</h3>
                            <p className="text-sm text-gray-500">{u.email}</p>
                         </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                         <button
                           onClick={() => navigate(`/resume/${u.id}`)}
                           className="btn-secondary text-xs sm:text-sm flex items-center gap-1"
                         >
                           <span className="material-symbols-outlined text-[16px]">description</span>
                           Resume
                         </button>
                         <button
                           onClick={() => openDocument(u.id, "license")}
                           className="btn-secondary text-xs sm:text-sm flex items-center gap-1"
                         >
                           <span className="material-symbols-outlined text-[16px]">id_card</span>
                           License
                         </button>
                         <button
                           onClick={() => openDocument(u.id, "id")}
                           className="btn-secondary text-xs sm:text-sm flex items-center gap-1"
                         >
                           <span className="material-symbols-outlined text-[16px]">badge</span>
                           ID Proof
                         </button>
                      </div>
                   </div>

                   <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                         <DetailItem label="Role" value={u.role} capitalize />
                         <DetailItem label="Registration Number" value={u.registration_number} />
                         <DetailItem label="Council" value={u.registration_council} />
                         <DetailItem label="Graduation Year" value={u.year_of_graduation} />
                      </div>

                      {/* AI RESULT SECTION */}
                      {result && (
                        <div className="mt-6 mb-6 bg-gray-50 rounded-xl border border-gray-200 p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                             <div className="flex items-center gap-3">
                                <span className="font-semibold text-gray-700">AI Analysis:</span>
                                <StatusBadge status={result.verification_status} />
                             </div>
                             <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Confidence Score:</span>
                                <span className="text-lg font-bold text-gray-900">{result.verification_score}%</span>
                             </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                             {/* Registry Match */}
                             {result.registry_result && (
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                   <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                      <span className="material-symbols-outlined text-purple-600">database</span>
                                      Registry Match (IMR)
                                   </h4>
                                   <div className="space-y-2 text-sm">
                                      <ValidationRow
                                         label="Name Match"
                                         status={safeNameMatch(result.registry_result.record?.name || result.registry_result.result?.name, u.name)}
                                         details={result.registry_result.record?.name || result.registry_result.result?.name}
                                      />
                                      <ValidationRow
                                         label="Reg. No. Match"
                                         status={String(result.registry_result.record?.registration_number || result.registry_result.result?.registration_number) === String(u.registration_number)}
                                         details={result.registry_result.record?.registration_number || result.registry_result.result?.registration_number}
                                      />
                                      <ValidationRow
                                         label="Year Match"
                                         status={checkYearMatch(result.registry_result.record?.year || result.registry_result.result?.year, u.year_of_graduation)}
                                         details={result.registry_result.record?.year || result.registry_result.result?.year}
                                      />
                                   </div>
                                </div>
                             )}

                             {/* OCR Results */}
                             <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
                                <div>
                                   <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                      <span className="material-symbols-outlined text-blue-600">document_scanner</span>
                                      License OCR
                                   </h4>
                                   <p className="text-sm text-gray-600">
                                      {result.extracted_license?.name ? `Detected: ${result.extracted_license.name}` : "No name detected"}
                                   </p>
                                </div>
                                <div>
                                   <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                      <span className="material-symbols-outlined text-green-600">badge</span>
                                      ID OCR
                                   </h4>
                                   <p className="text-sm text-gray-600">
                                      {result.extracted_id?.name ? `Detected: ${result.extracted_id.name}` : "No name detected"}
                                   </p>
                                </div>
                             </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4 border-t border-gray-100">
                         <button
                           onClick={() => runAICheck(u.id)}
                           disabled={verifyingId === u.id}
                           className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                         >
                           {verifyingId === u.id ? (
                             <>
                               <span className="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
                               Analyzing...
                             </>
                           ) : (
                             <>
                               <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                               Run AI Analysis
                             </>
                           )}
                         </button>
                         <button
                           onClick={() => reject(u.id)}
                           className="px-6 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition font-medium flex items-center justify-center gap-2"
                         >
                           <span className="material-symbols-outlined text-[18px]">block</span>
                           Reject
                         </button>
                         <button
                           onClick={() => approve(u.id)}
                           className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow"
                         >
                           <span className="material-symbols-outlined text-[18px]">check</span>
                           Approve
                         </button>
                      </div>
                   </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-modalFadeIn">
            <div className="flex items-center gap-3 mb-4 text-red-600">
               <span className="material-symbols-outlined text-3xl">gpp_bad</span>
               <h2 className="text-xl font-bold">Reject Verification</h2>
            </div>

            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this verification request. This will be visible to the user.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Documents are blurry, Name mismatch..."
              rows={4}
              className="input-field mb-6 resize-none"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                className="btn-danger bg-red-600 text-white hover:bg-red-700 border-red-600"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   HELPERS & COMPONENTS
   ========================= */

function DetailItem({ label, value, capitalize }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`font-medium text-gray-900 ${capitalize ? 'capitalize' : ''} break-words`}>
        {value || "—"}
      </p>
    </div>
  );
}

function ValidationRow({ label, status, details }) {
   return (
      <div className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-100">
         <div>
            <p className="font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-500">{details || "N/A"}</p>
         </div>
         {status ? (
            <span className="text-green-600 material-symbols-outlined">check_circle</span>
         ) : (
            <span className="text-red-500 material-symbols-outlined">cancel</span>
         )}
      </div>
   )
}


/* Helper logic for AI matching (Copied from original file to maintain logic) */
const normalize = (str) =>
  String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const getTokens = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(
      (w) =>
        w.length >= 3 &&
        !["dr", "mr", "ms", "mrs"].includes(w)
    );

const safeNameMatch = (a, b) => {
  if (!a || !b) return false;
  const na = normalize(a);
  const nb = normalize(b);
  if (na.length < 6 || nb.length < 6) return false;
  const ta = getTokens(a);
  const tb = getTokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  const matches = ta.filter(t => tb.includes(t));
  return (
    matches.length >= 2 ||
    matches.length / Math.min(ta.length, tb.length) >= 0.6
  );
};

const checkYearMatch = (registryYear, userGraduationYear) => {
  if (!registryYear || !userGraduationYear) return false;
  const registry = parseInt(registryYear, 10);
  const graduation = parseInt(userGraduationYear, 10);
  return registry === graduation || Math.abs(registry - graduation) <= 1;
};
