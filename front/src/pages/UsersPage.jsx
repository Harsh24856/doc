import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchUsers } from "../config/users";
import UserCard from "../components/UserCard";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const loadUsers = () => {
    fetchUsers()
      .then(setUsers)
      .catch((error) => {
        console.error("Failed to load users:", error);
        setUsers([]);
      });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Refresh users list when returning to this page
  useEffect(() => {
    if (location.pathname === "/messages") {
      loadUsers();
    }
  }, [location.pathname]);

  // Refresh on window focus to update unread counts
  useEffect(() => {
    const handleFocus = () => {
      loadUsers();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Messages</h2>

      <div className="space-y-2">
        {users.length === 0 ? (
          <p className="text-gray-500 text-center mt-4">No conversations yet</p>
        ) : (
          users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onClick={() => navigate(`/chat/${user.id}`)}
          />
          ))
        )}
      </div>
    </div>
  );
}