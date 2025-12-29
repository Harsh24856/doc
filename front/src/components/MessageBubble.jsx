export default function MessageBubble({ msg }) {
    if (!msg) return null;
    
    const isMe = msg.from === "me";
    const messageType = msg.type || "text";
    const isPending = msg.pending;
  
    return (
      <div className={`mb-3 flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div
          className={`inline-block px-4 py-2.5 rounded-2xl break-words max-w-[85%] sm:max-w-xs ${
            isMe 
              ? "bg-[var(--color-primary)] text-white rounded-br-sm" 
              : "bg-gray-100 text-gray-900 rounded-bl-sm"
          } ${isPending ? "opacity-70" : ""}`}
        >
          {messageType === "text" && (
            <p className="text-sm sm:text-base whitespace-pre-wrap">
              {msg.text || ""}
              {isPending && <span className="ml-1 opacity-50">⏳</span>}
            </p>
          )}
  
          {messageType === "link" && msg.text && (
            <a
              href={msg.text}
              target="_blank"
              rel="noreferrer"
              className={`underline text-sm sm:text-base ${
                isMe ? "text-white" : "text-[var(--color-primary)]"
              }`}
            >
              {msg.text}
            </a>
          )}
  
          {messageType === "image" && msg.file_url && (
            <div className="mt-1">
              <img
                src={msg.file_url}
                alt="Shared image"
                className="max-w-full rounded-lg"
                style={{ maxWidth: "250px", height: "auto" }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          )}
  
          {messageType === "document" && msg.file_url && (
            <a
              href={msg.file_url}
              target="_blank"
              rel="noreferrer"
              className={`underline text-sm sm:text-base flex items-center gap-2 ${
                isMe ? "text-white" : "text-[var(--color-primary)]"
              }`}
            >
              <span>📄</span>
              <span>{msg.file_name || "Document"}</span>
            </a>
          )}

          {/* Timestamp */}
          {msg.created_at && (
            <div className={`text-xs mt-1 ${isMe ? "text-white/70" : "text-gray-500"}`}>
              {new Date(msg.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          )}
        </div>
      </div>
    );
  }