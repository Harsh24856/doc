import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api.js";

export default function AdminDashboard() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH PENDING USERS
     ========================= */
  const fetchPending = async () => {
    console.log("[AdminDashboard] Fetching pending users");

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/verifications/pending`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      console.log(
        "[AdminDashboard] Fetch status:",
        res.status
      );

      const data = await res.json();
      console.log(
        "[AdminDashboard] Pending data:",
        data
      );

      if (!res.ok) {
        throw new Error(data.error || "Fetch failed");
      }

      setPending(data);
    } catch (err) {
      console.error(
        "[AdminDashboard] Fetch error:",
        err
      );
      alert("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  /* =========================
     OPEN DOCUMENT (SIGNED URL)
     ========================= */
  const openDocument = async (userId, type) => {
    console.log("[AdminDashboard] Open document:", {
      userId,
      type,
    });

    try {
      const url = `${API_BASE_URL}/admin/verifications/${userId}/document/${type}`;
      console.log("[AdminDashboard] Requesting document URL from:", url);

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      console.log(
        "[AdminDashboard] Document response status:",
        res.status,
        res.statusText
      );

      // Check content type before parsing
      const contentType = res.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
        console.log(
          "[AdminDashboard] Document response data:",
          data
        );
      } else {
        // Non-JSON response (likely HTML error page)
        const text = await res.text();
        console.error(
          "[AdminDashboard] Non-JSON response:",
          text.substring(0, 200)
        );
        throw new Error(
          `Server returned ${res.status} ${res.statusText}. Route may not exist.`
        );
      }

      if (!res.ok) {
        throw new Error(
          data.error || `Server error: ${res.status} ${res.statusText}`
        );
      }

      if (!data.url) {
        console.error("[AdminDashboard] No URL in response:", data);
        throw new Error("No document URL received from server");
      }

      console.log("[AdminDashboard] Opening document URL:", data.url);
      const newWindow = window.open(data.url, "_blank", "noopener,noreferrer");
      
      if (!newWindow) {
        console.warn("[AdminDashboard] Popup blocked, trying alternative method");
        // Fallback: create a temporary link and click it
        const link = document.createElement("a");
        link.href = data.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error(
        "[AdminDashboard] Open document error:",
        err
      );
      alert(err.message || "Failed to open document. Please check the console for details.");
    }
  };

  /* =========================
     APPROVE / REJECT
     ========================= */
  const approve = async (id) => {
    console.log("[AdminDashboard] Approving:", id);

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
    console.log("[AdminDashboard] Rejecting:", id);

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

  if (loading) return <div className="page">Loading...</div>;

  return (
    <div className="page">
      <div className="card wide">
        <h2 className="title">Pending Verifications</h2>

        {pending.length === 0 && (
          <p>No pending verifications</p>
        )}

        {pending.map((u) => (
          <div
            key={u.id}
            className="border p-4 rounded mb-4"
          >
            <p><b>Name:</b> {u.name}</p>
            <p><b>Email:</b> {u.email}</p>
            <p><b>Role:</b> {u.role}</p>
            <p><b>Specialization:</b> {u.specialization}</p>
            <p><b>Council:</b> {u.registration_council}</p>

            <div className="mt-3 flex gap-4">
              <button
                className="text-blue-600 underline"
                onClick={() =>
                  openDocument(u.id, "license")
                }
              >
                View License PDF
              </button>

              <button
                className="text-blue-600 underline"
                onClick={() =>
                  openDocument(u.id, "id")
                }
              >
                View ID Proof PDF
              </button>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                className="btn"
                onClick={() => approve(u.id)}
              >
                Approve
              </button>
              <button
                className="btn danger"
                onClick={() => reject(u.id)}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}