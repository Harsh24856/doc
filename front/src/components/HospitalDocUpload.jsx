import { useState } from "react";
import API_BASE_URL from "../config/api.js";

export default function HospitalDocUpload() {
  const [documentType, setDocumentType] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  /* UPLOAD DOCUMENT */
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!documentType || !file) {
      setMessage("Please select a document type and upload a PDF");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("document_type", documentType);

      const res = await fetch(
        `${API_BASE_URL}/hospital/documents/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setMessage(`✅ ${documentType} document uploaded successfully`);
      setFile(null);
      setDocumentType("");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 border rounded-xl p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Upload Verification Documents
      </h3>

      <form onSubmit={handleUpload} className="space-y-5">
        {/* DOCUMENT TYPE */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select document</option>
            <option value="registration">Hospital Registration Certificate</option>
            <option value="authorization">Authorization Letter</option>
            <option value="address">Address Proof</option>
            <option value="gst">GST Certificate (Optional)</option>
            <option value="nabh">NABH Certificate (Optional)</option>
          </select>
        </div>

        {/* FILE INPUT */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Upload PDF
          </label>
          <input
            type="file"
            accept="application/pdf"
            required
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-600
              file:mr-4 file:py-2.5 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              cursor-pointer"
          />
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg font-semibold text-white transition ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Uploading..." : "Upload Document"}
        </button>

        {/* MESSAGE */}
        {message && (
          <p className="text-center text-sm text-gray-700 mt-2">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
