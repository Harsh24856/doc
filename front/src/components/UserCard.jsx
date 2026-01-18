export default function UserCard({ user, onClick }) {
  const hasUnread = user.unreadCount > 0;
  const displayName = user.name || user.email;
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div
      onClick={onClick}
      className={`group relative p-4 border rounded-xl cursor-pointer transition-all duration-200
        ${
          hasUnread
            ? "bg-white border-blue-200 shadow-sm"
            : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm"
        }`}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 transition-colors
          ${hasUnread ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"}`}>
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
             <h3 className={`font-semibold truncate text-sm sm:text-base ${hasUnread ? "text-gray-900" : "text-gray-700"}`}>
              {displayName}
            </h3>
            {hasUnread && (
              <span className="shrink-0 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white"></span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className={`text-sm truncate ${hasUnread ? "text-gray-900 font-medium" : "text-gray-500"}`}>
              {user.isFromMe && <span className="text-gray-400 font-normal mr-1">You:</span>}
              {user.lastMessage || "Start a conversation"}
            </p>

             {hasUnread && user.unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                {user.unreadCount > 99 ? "99+" : user.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
