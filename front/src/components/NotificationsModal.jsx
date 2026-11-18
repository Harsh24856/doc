import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import API_BASE_URL from "../config/api.js";
import { Modal, Icon, SkeletonCard, EmptyState, Button, dur, easeOut } from "../ui";

const typeIcon = { verification: "verified", job: "work", application: "assignment", message: "chat" };

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (isNaN(s)) return "";
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function NotificationsModal({ isOpen, onClose, onMarkedRead }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !token) return;
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("Failed to fetch notifications");
        const data = await res.json();
        setNotifications(data.notifications || []);
        if ((data.unread_count || 0) > 0) {
          fetch(`${API_BASE_URL}/notifications/mark-read`, { method: "POST", headers: { Authorization: `Bearer ${token}` } })
            .then(() => onMarkedRead?.())
            .catch(() => {});
        }
      } catch (err) {
        console.error("Error fetching notifications:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, token]);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Updates"
      subtitle="Activity on your account"
      icon="notifications"
      size="md"
      footer={
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            iconRight="arrow_forward"
            onClick={() => {
              onClose();
              navigate("/notifications");
            }}
          >
            View all
          </Button>
        </div>
      }
    >
      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard lines={1} />
            <SkeletonCard lines={1} />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState icon="notifications_off" title="You're all caught up" description="New verification results, applications and messages will appear here." />
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((n, i) => (
              <motion.li
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04, duration: dur.slow, ease: easeOut }}
              >
                <button
                  type="button"
                  disabled={!n.link}
                  onClick={() => {
                    if (n.link) {
                      onClose();
                      navigate(n.link);
                    }
                  }}
                  className="group flex w-full items-start gap-3 rounded-xl px-2 py-3.5 text-left transition-colors duration-150 enabled:hover:bg-gray-50 disabled:cursor-default"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral-50 text-coral-600">
                    <Icon name={typeIcon[n.type] || "notifications"} className="text-[20px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-gray-900">{n.title}</span>
                      <span className="shrink-0 text-xs text-gray-500">{timeAgo(n.created_at)}</span>
                    </span>
                    <span className="mt-0.5 block text-sm text-gray-600">{n.message}</span>
                  </span>
                  {n.link && <Icon name="chevron_right" className="mt-2 text-gray-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-coral-500" />}
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
