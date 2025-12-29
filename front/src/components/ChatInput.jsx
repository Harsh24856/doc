import { useState } from "react";
import { uploadFile } from "../config/upload";

export default function ChatInput({ onSend }) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleSendText = () => {
    if (!text.trim() || uploading) return;

    const isLink = text.startsWith("http");

    onSend({
      type: isLink ? "link" : "text",
      text: text.trim(),
    });

    setText("");
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await uploadFile(file);

      onSend({
        type: data.type,
        file_url: data.url,
        file_name: data.name,
        text: "",
      });
    } catch (error) {
      console.error("File upload error:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  return (
    <div className="p-3 bg-white safe-area-inset-bottom">
      <div className="flex gap-2 items-end max-w-4xl mx-auto">
        {/* File upload button - larger touch target */}
        <input
          type="file"
          onChange={handleFile}
          className="hidden"
          id="fileUpload"
          disabled={uploading}
          accept="image/*,application/pdf,.doc,.docx"
        />

        <label
          htmlFor="fileUpload"
          className="cursor-pointer text-2xl p-2 -ml-2 active:opacity-70 touch-manipulation"
          style={{ minWidth: "44px", minHeight: "44px" }}
          aria-label="Upload file"
        >
          📎
        </label>

        {/* Text input - mobile optimized */}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendText();
            }
          }}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          placeholder="Type a message..."
          disabled={uploading}
          autoComplete="off"
          autoCorrect="on"
          autoCapitalize="sentences"
        />

        {/* Send button - larger touch target */}
        <button
          onClick={handleSendText}
          disabled={!text.trim() || uploading}
          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg transition font-medium touch-manipulation active:scale-95"
          style={{ minWidth: "60px", minHeight: "44px" }}
          aria-label="Send message"
        >
          {uploading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}