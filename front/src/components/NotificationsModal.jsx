import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";

export default function NotificationsModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH NOTIFICATIONS
     ========================= */
  useEffect(() => {
    if (!isOpen || !token) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch notifications");

        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        console.error("Error fetching notifications:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen, token]);

  /* =========================
     CLOSE ON ESC
     ========================= */
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  /* =========================
     ICONS
     ========================= */
  const getNotificationIcon = (type) => {
    switch (type) {
      case "verification":
        return (
          <span className="material-symbols-outlined text-3xl text-green-600">
            verified
          </span>
        );
      case "job":
        return (
          <span className="material-symbols-outlined text-3xl text-purple-600">
            work
          </span>
        );
      default:
        return (
          <span className="material-symbols-outlined text-3xl text-gray-600">
            notifications
          </span>
        );
    }
  };

  /* =========================
     UI
     ========================= */
  return (
    <>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-white">
                  updates
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  System Updates
                </h1>
                <p className="text-white/80 text-sm">
                  Important updates regarding your account
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
                <p className="text-gray-500">Loading updates…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-6xl text-gray-400 mb-4 block">
                  updates_off
                </span>
                <p className="text-xl font-semibold text-gray-800 mb-2">
                  No updates
                </p>
                <p className="text-gray-500">
                  You’re all caught up.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (n.link) {
                        onClose();
                        navigate(n.link);
                      }
                    }}
                    className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50 cursor-pointer hover:shadow-lg transition"
                  >
                    <div className="flex gap-4">
                      {/* <div className="flex-shrink-0">
                        {getNotificationIcon(n.type)}
                      </div> */}

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {n.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {n.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
