import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api.js";

export default function AdminDashboard() {
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading admin dashboard…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow p-8">
        <h2 className="text-3xl font-bold mb-6">Pending Verifications</h2>

        {pending.length === 0 && (
          <p className="text-gray-500">No pending verifications</p>
        )}

        {pending.map((u) => {
          const result = results[u.id];

          return (
            <div key={u.id} className="border rounded-lg p-6 mb-6">
              {/* USER INFO */}
              <div className="grid grid-cols-2 gap-4 text-gray-700">
                <p><b>Name:</b> {u.name}</p>
                <p><b>Email:</b> {u.email}</p>
                <p><b>Role:</b> <span className="capitalize">{u.role}</span></p>
                <p><b>Registration No:</b> {u.registration_number}</p>
              </div>

              {/* DOCUMENTS */}
              <div className="mt-4 flex gap-4">
                <button
                  onClick={() => openDocument(u.id, "license")}
                  className="text-blue-600 underline"
                >
                  View License
                </button>
                <button
                  onClick={() => openDocument(u.id, "id")}
                  className="text-blue-600 underline"
                >
                  View ID
                </button>
              </div>

              {/* AI RESULT */}
              {result && (
                <div className="mt-5 space-y-4">
                  <div className="p-4 rounded bg-gray-100">
                    <p className="font-semibold mb-1">
                      Verification Status:{" "}
                      <span
                        className={
                          result.verification_status === "VERIFIED"
                            ? "text-green-600"
                            : result.verification_status === "PARTIALLY_VERIFIED"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {result.verification_status}
                      </span>
                    </p>

                    <p>
                      <b>Verification Score:</b>{" "}
                      {result.verification_score}%
                    </p>

                    <p className="text-sm text-gray-600">
                      Registry: {result.breakdown?.registry_score ?? 0}% ·
                      License OCR: {result.breakdown?.license_ocr_score ?? 0}% ·
                      ID OCR: {result.breakdown?.id_ocr_score ?? 0}%
                    </p>
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
                      <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                        <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
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
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => runAICheck(u.id)}
                  disabled={verifyingId === u.id}
                  className={`px-4 py-2 rounded text-white ${
                    verifyingId === u.id
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {verifyingId === u.id ? "Verifying…" : "Run AI Check"}
                </button>

                <button
                  onClick={() => approve(u.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Approve
                </button>

                <button
                  onClick={() => reject(u.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}