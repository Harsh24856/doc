import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api.js";

export default function AdminDashboard() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

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

      if (!res.ok) {
        throw new Error(data.error || "Fetch failed");
      }

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
    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/verifications/${userId}/document/${type}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to fetch document");
      }

      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      alert(err.message || "Failed to open document");
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-white px-6 py-10">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Pending Verifications
        </h2>

        {pending.length === 0 && (
          <p className="text-gray-500">
            No pending verifications
          </p>
        )}

        <div className="space-y-6">
          {pending.map((u) => (
            <div
              key={u.id}
              className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                <p><b>Name:</b> {u.name}</p>
                <p><b>Email:</b> {u.email}</p>
                <p><b>Role:</b> {u.role}</p>
                <p><b>Specialization:</b> {u.specialization || "-"}</p>
                <p><b>Council:</b> {u.registration_council}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-4">
                <button
                  onClick={() => openDocument(u.id, "license")}
                  className="text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  View License PDF
                </button>

                <button
                  onClick={() => openDocument(u.id, "id")}
                  className="text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  View ID Proof PDF
                </button>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => approve(u.id)}
                  className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition"
                >
                  Approve
                </button>

                <button
                  onClick={() => reject(u.id)}
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}