import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";
import logo2 from "../assets/2.png";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [results, setResults] = useState({});

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

  const reject = async (id) => {
    await fetch(
      `${API_BASE_URL}/admin/verifications/${id}/reject`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    fetchPending();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading admin dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8 text-center">
          <img 
            src={logo2} 
            alt="DocSpace Logo" 
            className="h-16 sm:h-24 md:h-32 w-auto mx-auto mb-4 sm:mb-6 object-contain"
          />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage pending verifications
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl sm:text-3xl text-[var(--color-primary)]">pending_actions</span>
              Pending Verifications
            </h2>
            {pending.length > 0 && (
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--color-primary)] text-white rounded-full text-xs sm:text-sm font-semibold">
                {pending.length} Pending
              </span>
            )}
          </div>

          <div>
            {pending.length === 0 && (
              <div className="text-center py-12 sm:py-16">
                <span className="material-symbols-outlined text-6xl sm:text-7xl text-gray-300 mb-4">check_circle</span>
                <p className="text-lg sm:text-xl text-gray-500 font-medium">No pending verifications</p>
                <p className="text-sm sm:text-base text-gray-400 mt-2">All verifications have been processed</p>
              </div>
            )}

            {pending.map((u) => {
            const result = results[u.id];

            return (
              <div key={u.id} className="border-2 border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300">
                {/* USER INFO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400">person</span>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Name</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">{u.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400">email</span>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Email</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 break-all">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400">badge</span>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Role</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 capitalize">{u.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400">description</span>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Registration No</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">{u.registration_number || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* DOCUMENTS */}
                <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <button
                    onClick={() => navigate(`/resume/${u.id}`)}
                    className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <span className="material-symbols-outlined text-lg">description</span>
                    View Resume
                  </button>
                  <button
                    onClick={() => openDocument(u.id, "license")}
                    className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-[var(--color-accent)] text-[var(--color-primary-dark)] rounded-lg font-semibold text-sm hover:bg-[var(--color-primary)] hover:text-white transition-all duration-300"
                  >
                    <span className="material-symbols-outlined text-lg">description</span>
                    View License
                  </button>
                  <button
                    onClick={() => openDocument(u.id, "id")}
                    className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-[var(--color-accent)] text-[var(--color-primary-dark)] rounded-lg font-semibold text-sm hover:bg-[var(--color-primary)] hover:text-white transition-all duration-300"
                  >
                    <span className="material-symbols-outlined text-lg">badge</span>
                    View ID
                  </button>
                </div>

                {/* AI RESULT */}
                {result && (
                  <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                    <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3">
                        <p className="font-bold text-base sm:text-lg">
                          Verification Status:{" "}
                          <span
                            className={`px-3 py-1 rounded-full text-sm sm:text-base ${
                              result.verification_status === "VERIFIED"
                                ? "bg-green-100 text-green-700"
                                : result.verification_status === "PARTIALLY_VERIFIED"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {result.verification_status}
                          </span>
                        </p>
                        <p className="text-lg sm:text-xl font-bold text-[var(--color-primary)]">
                          Score: {result.verification_score}%
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">database</span>
                          Registry: {result.breakdown?.registry_score ?? 0}%
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">description</span>
                          License OCR: {result.breakdown?.license_ocr_score ?? 0}%
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">badge</span>
                          ID OCR: {result.breakdown?.id_ocr_score ?? 0}%
                        </span>
                      </div>
                    </div>

                  {/* REGISTRY RESULT */}
                  {result.registry_result && (result.registry_result.status === "SUCCESS" || result.registry_result.status === "FOUND") && (
                    <div className="p-4 rounded-lg border border-purple-200 bg-purple-50">
                      <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                        🏥 Registry Check Results (IMR)
                      </h3>
                      <div className="space-y-3 text-sm">
                        <p className="font-medium text-green-600">Status: {result.registry_result.status}</p>
                        {(() => {
                          const registryData = result.registry_result.record || result.registry_result.result;
                          if (!registryData) return null;

                          // Helper function to normalize strings for comparison
                          const normalize = (str) => String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                          
                          // Helper function to check if year matches graduation
                          const checkYearMatch = (registryYear, userGraduationYear) => {
                            if (!registryYear || !userGraduationYear) return false;
                            const registry = parseInt(registryYear, 10);
                            const graduation = parseInt(userGraduationYear, 10);
                            return registry === graduation || Math.abs(registry - graduation) <= 1;
                          };

                          // Compare values
                          const nameMatch = registryData.name && u.name && 
                            (normalize(registryData.name).includes(normalize(u.name)) || 
                             normalize(u.name).includes(normalize(registryData.name)));
                          
                          const regNoMatch = registryData.registration_number && u.registration_number &&
                            normalize(registryData.registration_number) === normalize(u.registration_number);
                          
                          const councilMatch = registryData.council && u.registration_council &&
                            (normalize(registryData.council).includes(normalize(u.registration_council)) ||
                             normalize(u.registration_council).includes(normalize(registryData.council)));
                          
                          const yearMatch = checkYearMatch(registryData.year, u.year_of_graduation);

                          return (
                            <div className="space-y-2">
                              {/* Name Comparison */}
                              <div className="flex items-center justify-between p-2 bg-white rounded">
                                <div>
                                  <p className="font-medium">Name</p>
                                  <p className="text-gray-600">IMR: {registryData.name || "N/A"}</p>
                                  <p className="text-gray-600">User: {u.name || "N/A"}</p>
                                </div>
                                <span className={`text-2xl ${nameMatch ? "text-green-600" : "text-red-600"}`}>
                                  {nameMatch ? "✓" : "✗"}
                                </span>
                              </div>

                              {/* Registration Number Comparison */}
                              <div className="flex items-center justify-between p-2 bg-white rounded">
                                <div>
                                  <p className="font-medium">Registration Number</p>
                                  <p className="text-gray-600">IMR: {registryData.registration_number || "N/A"}</p>
                                  <p className="text-gray-600">User: {u.registration_number || "N/A"}</p>
                                </div>
                                <span className={`text-2xl ${regNoMatch ? "text-green-600" : "text-red-600"}`}>
                                  {regNoMatch ? "✓" : "✗"}
                                </span>
                              </div>

                              {/* Council Comparison */}
                              <div className="flex items-center justify-between p-2 bg-white rounded">
                                <div>
                                  <p className="font-medium">Council</p>
                                  <p className="text-gray-600">IMR: {registryData.council || "N/A"}</p>
                                  <p className="text-gray-600">User: {u.registration_council || "N/A"}</p>
                                </div>
                                <span className={`text-2xl ${councilMatch ? "text-green-600" : "text-red-600"}`}>
                                  {councilMatch ? "✓" : "✗"}
                                </span>
                              </div>

                              {/* Year/Graduation Comparison */}
                              <div className="flex items-center justify-between p-2 bg-white rounded">
                                <div>
                                  <p className="font-medium">Year / Graduation</p>
                                  <p className="text-gray-600">IMR Year: {registryData.year || "N/A"}</p>
                                  <p className="text-gray-600">User Graduation: {u.year_of_graduation || "N/A"}</p>
                                </div>
                                <span className={`text-2xl ${yearMatch ? "text-green-600" : "text-red-600"}`}>
                                  {yearMatch ? "✓" : "✗"}
                                </span>
                              </div>

                              {/* Additional Info */}
                              {registryData.father_name && (
                                <div className="p-2 bg-white rounded">
                                  <p className="font-medium">Father's Name</p>
                                  <p className="text-gray-600">{registryData.father_name}</p>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* OCR RESULTS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* License OCR Results */}
                    {result.extracted_license && (
                      <div className="p-4 rounded-lg border border-red-200 bg-[var(--color-accent)]">
                        <h3 className="font-semibold text-[var(--color-primary-dark)] mb-3 flex items-center gap-2">
                          📜 License OCR Results
                        </h3>
                        <div className="space-y-2 text-sm">
                          {result.extracted_license.name && (
                            <p><b>Name:</b> {result.extracted_license.name}</p>
                          )}
                          {result.extracted_license.registration_number && (
                            <p><b>Registration Number:</b> {result.extracted_license.registration_number}</p>
                          )}
                          {result.extracted_license.registration_council && (
                            <p><b>Council:</b> {result.extracted_license.registration_council}</p>
                          )}
                          {result.extracted_license.primary_qualification && (
                            <p><b>Primary Qualification:</b> {result.extracted_license.primary_qualification}</p>
                          )}
                          {result.extracted_license.additional_qualification && (
                            <p><b>Additional Qualification:</b> {result.extracted_license.additional_qualification}</p>
                          )}
                          {!result.extracted_license.name && 
                           !result.extracted_license.registration_number && 
                           !result.extracted_license.registration_council && (
                            <p className="text-gray-500 italic">No data extracted from license</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ID OCR Results */}
                    {result.extracted_id && (
                      <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                        <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                          🆔 ID OCR Results
                        </h3>
                        <div className="space-y-2 text-sm">
                          {result.extracted_id.name && (
                            <p><b>Name:</b> {result.extracted_id.name}</p>
                          )}
                          {result.extracted_id.dob && (
                            <p><b>Date of Birth:</b> {result.extracted_id.dob}</p>
                          )}
                          {result.extracted_id.gender && (
                            <p><b>Gender:</b> {result.extracted_id.gender}</p>
                          )}
                          {result.extracted_id.id_number && (
                            <p><b>ID Number:</b> {result.extracted_id.id_number}</p>
                          )}
                          {result.extracted_id.id_type && (
                            <p><b>ID Type:</b> {result.extracted_id.id_type}</p>
                          )}
                          {!result.extracted_id.name && 
                           !result.extracted_id.dob && 
                           !result.extracted_id.id_number && (
                            <p className="text-gray-500 italic">No data extracted from ID</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

                {/* ACTIONS */}
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t-2 border-gray-200">
                  <button
                    onClick={() => runAICheck(u.id)}
                    disabled={verifyingId === u.id}
                    className={`flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base text-white transition-all duration-300 ${
                      verifyingId === u.id
                        ? "bg-[var(--color-primary-dark)] opacity-60 cursor-not-allowed"
                        : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] hover:shadow-lg transform hover:scale-105"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {verifyingId === u.id ? "hourglass_empty" : "auto_awesome"}
                    </span>
                    {verifyingId === u.id ? "Verifying…" : "Run AI Check"}
                  </button>

                  <button
                    onClick={() => approve(u.id)}
                    className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Approve
                  </button>

                  <button
                    onClick={() => reject(u.id)}
                    className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                  >
                    <span className="material-symbols-outlined text-lg">cancel</span>
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}