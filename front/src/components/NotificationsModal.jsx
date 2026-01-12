import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";

export default function NotificationsModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  /* =========================
     GET READ NOTIFICATIONS FROM LOCALSTORAGE
     ========================= */
  const getReadNotifications = () => {
    try {
      const read = localStorage.getItem("readNotifications");
      return read ? JSON.parse(read) : [];
    } catch {
      return [];
    }
  };

  /* =========================
     MARK NOTIFICATION AS READ IN LOCALSTORAGE
     ========================= */
  const markAsReadInStorage = (notificationId) => {
    try {
      const read = getReadNotifications();
      if (!read.includes(notificationId)) {
        read.push(notificationId);
        localStorage.setItem("readNotifications", JSON.stringify(read));
      }
    } catch (err) {
      console.error("Error saving read status:", err);
    }
  };

  /* =========================
     FETCH NOTIFICATIONS
     ========================= */
  useEffect(() => {
    if (!isOpen) return;

    const fetchNotifications = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch notifications");
        }

        const data = await res.json();
        const readNotifications = getReadNotifications();
        
        // Mark notifications as read if they're in localStorage
        const notificationsWithReadStatus = (data.notifications || []).map(n => ({
          ...n,
          read: readNotifications.includes(n.id),
        }));

        setNotifications(notificationsWithReadStatus);
        
        // Count unread notifications
        const unread = notificationsWithReadStatus.filter(n => !n.read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Error fetching notifications:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen, token]);

  /* =========================
     MARK AS READ
     ========================= */
  const markAsRead = async (notificationId) => {
    try {
      // Mark in localStorage
      markAsReadInStorage(notificationId);

      // Update UI immediately
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      // Also call backend (for future database implementation)
      try {
        await fetch(
          `${API_BASE_URL}/notifications/${notificationId}/read`,
          {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err) {
        // Backend call failed, but localStorage update succeeded
        console.error("Backend mark as read failed:", err.message);
      }
    } catch (err) {
      console.error("Error marking as read:", err.message);
    }
  };

  /* =========================
     MARK ALL AS READ
     ========================= */
  const markAllAsRead = async () => {
    try {
      // Mark all current notifications as read in localStorage
      const readNotifications = getReadNotifications();
      notifications.forEach(n => {
        if (!readNotifications.includes(n.id)) {
          readNotifications.push(n.id);
        }
      });
      localStorage.setItem("readNotifications", JSON.stringify(readNotifications));

      // Update UI immediately
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      setUnreadCount(0);

      // Also call backend (for future database implementation)
      try {
        await fetch(`${API_BASE_URL}/notifications/read-all`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        // Backend call failed, but localStorage update succeeded
        console.error("Backend mark all as read failed:", err.message);
      }
    } catch (err) {
      console.error("Error marking all as read:", err.message);
    }
  };

  /* =========================
     ICONS
     ========================= */
  const getNotificationIcon = (type) => {
    switch (type) {
      case "application":
        return <span className="material-symbols-outlined text-3xl text-blue-600">description</span>;
      case "verification":
        return <span className="material-symbols-outlined text-3xl text-green-600">verified</span>;
      case "job":
        return <span className="material-symbols-outlined text-3xl text-purple-600">work</span>;
      case "approval":
        return <span className="material-symbols-outlined text-3xl text-orange-600">celebration</span>;
      default:
        return <span className="material-symbols-outlined text-3xl text-gray-600">notifications</span>;
    }
  };

  /* =========================
     CLICK HANDLER
     ========================= */
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.link) {
      onClose(); // Close modal first
      navigate(notification.link);
    }
  };

  /* =========================
     CLOSE ON CLICK OUTSIDE
     ========================= */
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  /* =========================
     UI
     ========================= */
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 transform transition-all duration-300 scale-100 opacity-100"
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: "modalFadeIn 0.3s ease-out"
          }}
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-white">notifications</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  Notifications
                </h1>
                <p className="text-red-100 text-sm">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                    : "All caught up!"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-sm font-semibold transition-all duration-300"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all duration-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* LIST */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
                <p className="text-gray-500">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-6xl text-gray-400 mb-4 block">notifications_off</span>
                <p className="text-xl font-semibold text-gray-800 mb-2">
                  No notifications
                </p>
                <p className="text-gray-500">
                  You're all caught up.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                      n.read
                        ? "bg-gray-50 border-gray-200 hover:border-gray-300"
                        : "bg-blue-50 border-blue-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(n.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold mb-1 ${
                          n.read ? "text-gray-700" : "text-gray-900"
                        }`}>
                          {n.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {n.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>

                      {!n.read && (
                        <span className="w-3 h-3 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                      )}
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

