import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api.js";

export default function AdminDashboard() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null); // 👈 loading per user
  const [results, setResults] = useState({}); // 👈 store AI results

  /* =========================
     FETCH PENDING USERS
     ========================= */
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
    } catch (err) {
      alert("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  /* =========================
     OPEN DOCUMENT
     ========================= */
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
    if (data.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
  };

  /* =========================
     RUN AI CHECK
     ========================= */
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

      // Store result locally
      setResults((prev) => ({
        ...prev,
        [id]: data,
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setVerifyingId(null);
    }
  };

  /* =========================
     APPROVE / REJECT
     ========================= */
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

  /* =========================
     UI STATES
     ========================= */
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
            <div
              key={u.id}
              className="border rounded-lg p-6 mb-6"
            >
              {/* USER INFO */}
              <div className="grid grid-cols-2 gap-4 text-gray-700">
                <p><b>Name:</b> {u.name}</p>
                <p><b>Email:</b> {u.email}</p>
                <p><b>Registration No:</b> {u.registration_number}</p>
                <p><b>Council:</b> {u.registration_council}</p>
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
                  {/* Verification Summary */}
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
                      OCR: {result.breakdown.ocr_score}% · Registry:{" "}
                      {result.breakdown.registry_score}%
                    </p>
                  </div>

                  {/* OCR Extracted License Data */}
                  {result.extracted_license && (
                    <div className="p-4 rounded bg-blue-50 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        📄 OCR Extracted from License
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p>
                          <b>Name:</b> {result.extracted_license.name || "N/A"}
                        </p>
                        <p>
                          <b>Registration:</b>{" "}
                          {result.extracted_license.registration_number || "N/A"}
                        </p>
                        <p>
                          <b>Council:</b>{" "}
                          {result.extracted_license.registration_council || "N/A"}
                        </p>
                        <p>
                          <b>Qualification:</b>{" "}
                          {result.extracted_license.primary_qualification || "N/A"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* IMR Registry Result */}
                  {result.registry_result && (
                    <div className="p-4 rounded border-2">
                      <h4 className="font-semibold mb-2">
                        🏥 NMC Registry Check Result
                      </h4>
                      {result.registry_result.status === "FOUND" &&
                      result.registry_result.record ? (
                        <div>
                          <p className="mb-2">
                            <span
                              className={`px-2 py-1 rounded text-sm font-semibold ${
                                result.breakdown.registry_score > 0
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {result.registry_result.status}
                            </span>
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm bg-white p-3 rounded">
                            <p>
                              <b>Name:</b>{" "}
                              {result.registry_result.record.name || "N/A"}
                            </p>
                            <p>
                              <b>Registration:</b>{" "}
                              {result.registry_result.record.registration_number ||
                                "N/A"}
                            </p>
                            <p>
                              <b>Council:</b>{" "}
                              {result.registry_result.record.state_medical_council ||
                                "N/A"}
                            </p>
                            <p>
                              <b>Year:</b>{" "}
                              {result.registry_result.record.year_of_info || "N/A"}
                            </p>
                            {result.registry_result.record.father_name && (
                              <p>
                                <b>Father's Name:</b>{" "}
                                {result.registry_result.record.father_name}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Source: {result.registry_result.source || "NMC_IMR"}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="mb-2">
                            <span className="px-2 py-1 rounded text-sm font-semibold bg-red-100 text-red-800">
                              {result.registry_result.status || "NOT_FOUND"}
                            </span>
                          </p>
                          {result.registry_result.error && (
                            <p className="text-sm text-red-600">
                              Error: {result.registry_result.error}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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
                  disabled={verifyingId === u.id}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Approve
                </button>

                <button
                  onClick={() => reject(u.id)}
                  disabled={verifyingId === u.id}
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