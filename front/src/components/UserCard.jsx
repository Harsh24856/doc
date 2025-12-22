export default function UserCard({ user, onClick }) {
    const hasUnread = user.unreadCount > 0;
    const displayName = user.name || user.email;
    
    return (
      <div
        onClick={onClick}
        className={`p-3 border rounded cursor-pointer hover:bg-gray-100 transition-colors ${
          hasUnread ? "bg-green-50 border-green-300" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className={`font-medium truncate ${hasUnread ? "text-green-700" : ""}`}>
              {displayName}
            </p>
            {user.lastMessage && (
              <p className="text-sm text-gray-600 mt-1 truncate">
                {user.isFromMe ? "You: " : ""}{user.lastMessage}
              </p>
            )}
          </div>
          {hasUnread && (
            <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex-shrink-0">
              {user.unreadCount > 99 ? "99+" : user.unreadCount}
            </span>
          )}
        </div>
      </div>
    );
  }