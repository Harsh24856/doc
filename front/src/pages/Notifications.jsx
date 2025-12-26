import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";

export default function Notifications() {
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
  }, [token]);

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
        return "📝";
      case "verification":
        return "🛡️";
      case "job":
        return "💼";
      case "approval":
        return "🎉"; // ✅ interview approved
      default:
        return "🔔";
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
      navigate(notification.link);
    }
  };

  /* =========================
     LOADING
     ========================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading notifications...</p>
      </div>
    );
  }

  /* =========================
     UI
     ========================= */
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* HEADER */}
        <div className="bg-blue-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                🔔 Notifications
              </h1>
              <p className="text-blue-100">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "All caught up!"}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* LIST */}
        <div className="p-6">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔕</div>
              <p className="text-xl font-semibold text-gray-800">
                No notifications
              </p>
              <p className="text-gray-500 mt-1">
                You're all caught up.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-5 rounded-xl border cursor-pointer transition ${
                    n.read
                      ? "bg-gray-50 border-gray-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="text-3xl">
                      {getNotificationIcon(n.type)}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {n.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>

                    {!n.read && (
                      <span className="w-3 h-3 rounded-full bg-blue-600 mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}