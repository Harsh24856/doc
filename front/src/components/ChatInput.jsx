import { useState } from "react";
import { uploadFile } from "../config/upload";

export default function ChatInput({ onSend }) {
  const [text, setText] = useState("");

  const handleSendText = () => {
    if (!text.trim()) return;

    const isLink = text.startsWith("http");

    onSend({
      type: isLink ? "link" : "text",
      text,
    });

    setText("");
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
    }
  };

  return (
    <div className="p-2 border-t flex gap-2 items-center">
      <input
        type="file"
        onChange={handleFile}
        className="hidden"
        id="fileUpload"
      />

      <label
        htmlFor="fileUpload"
        className="cursor-pointer text-xl"
      >
        📎
      </label>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            handleSendText();
          }
        }}
        className="flex-1 border rounded px-3 py-2"
        placeholder="Type a message..."
      />

      <button
        onClick={handleSendText}
        className="bg-blue-600 text-white px-4 rounded"
      >
        Send
      </button>
    </div>
  );
}