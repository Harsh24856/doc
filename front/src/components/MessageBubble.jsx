export default function MessageBubble({ msg }) {
    if (!msg) return null;
    
    const isMe = msg.from === "me";
    const messageType = msg.type || "text";
  
    return (
      <div className={`mb-2 ${isMe ? "text-right" : "text-left"}`}>
        <div
          className={`inline-block px-3 py-2 rounded max-w-xs break-words ${
            isMe ? "bg-[var(--color-primary)] text-white" : "bg-gray-200"
          }`}
        >
          {messageType === "text" && (msg.text || "")}
  
          {messageType === "link" && msg.text && (
            <a
              href={msg.text}
              target="_blank"
              rel="noreferrer"
              className="underline text-[var(--color-primary)]"
            >
              {msg.text}
            </a>
          )}
  
          {messageType === "image" && msg.file_url && (
            <img
              src={msg.file_url}
              alt="Shared image"
              className="max-w-xs rounded"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
  
          {messageType === "document" && msg.file_url && (
            <a
              href={msg.file_url}
              target="_blank"
              rel="noreferrer"
              className="underline text-[var(--color-primary)]"
            >
              📄 {msg.file_name || "Document"}
            </a>
          )}
        </div>
      </div>
    );
  }