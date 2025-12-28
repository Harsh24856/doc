import { useState } from "react";
import API_BASE_URL from "../config/api.js";

/* DOCUMENT CONFIG */
const DOCUMENTS = [
  { key: "registration", label: "Hospital Registration Certificate", required: true },
  { key: "authorization", label: "Authorization Letter", required: true },
  { key: "address", label: "Address Proof", required: true },
  { key: "gst", label: "GST Certificate", required: false },
  { key: "nabh", label: "NABH Certificate", required: false },
];

const REQUIRED_DOCS = ["registration", "authorization", "address"];

export default function HospitalDocUpload({onVerificationSent}) {
  const token = localStorage.getItem("token");

  const [documents, setDocuments] = useState({});
  const [loadingDoc, setLoadingDoc] = useState(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  /* CHECK IF VERIFICATION CAN BE SENT */
  const canSendForVerification = REQUIRED_DOCS.every(
    (doc) => documents[doc]
  );

  /* HANDLE DOCUMENT UPLOAD */
  const handleUpload = async (documentType, file) => {
    if (!file) return;

    setLoadingDoc(documentType);
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
      if (!res.ok) throw new Error(data.message || "Upload failed");

      setDocuments((prev) => ({
        ...prev,
        [documentType]: {
          fileName: file.name,
        },
      }));

      setMessage("Document uploaded successfully");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoadingDoc(null);
    }
  };

  /* SEND FOR VERIFICATION */
  const handleSendForVerification = async () => {
  const confirmed = window.confirm(
  "Once you send your documents for verification, you will not be able to edit your profile or documents until review is complete.\n\nAre you sure you want to continue?"
);

if (!confirmed) {
  return;
}
  setSending(true);
  setMessage("");

  try {
    const submittedDocuments = Object.keys(documents)
    const res = await fetch(
  `${API_BASE_URL}/hospital/documents/send`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      submitted_documents: submittedDocuments,
    }),
  }
);

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to send");

    setMessage("✅ Verification request sent successfully");

    //CALL PARENT FUNCTION
    if (onVerificationSent) {
      onVerificationSent();
    }
  } catch (err) {
    setMessage(err.message);
  } finally {
    setSending(false);
  }
};


  return (
    <div className="space-y-6">
      {/* DOCUMENT UPLOAD STRIPS */}
      {DOCUMENTS.map((doc) => {
        const uploaded = documents[doc.key];
        const isLoading = loadingDoc === doc.key;

        return (
          <div key={doc.key} className="space-y-2">
            <h4 className="text-sm font-medium text-gray-800">
              {doc.label}
              {doc.required && <span className="text-red-500 ml-1">*</span>}
            </h4>

            <div className="flex items-center justify-between border rounded-lg px-4 py-3 bg-white">
              {!uploaded ? (
                <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-600 hover:text-blue-600">
                  <span>Upload PDF</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) =>
                      handleUpload(doc.key, e.target.files[0])
                    }
                  />
                </label>
              ) : (
                <span className="text-sm text-gray-700 truncate">
                  📄 {uploaded.fileName}
                </span>
              )}

              {uploaded && (
                <label className="text-sm text-blue-600 font-medium cursor-pointer hover:underline">
                  {isLoading ? "Uploading..." : "Change"}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) =>
                      handleUpload(doc.key, e.target.files[0])
                    }
                  />
                </label>
              )}

              {!uploaded && isLoading && (
                <span className="text-sm text-blue-600">Uploading...</span>
              )}
            </div>
          </div>
        );
      })}

      {/* SEND FOR VERIFICATION BUTTON */}
      <div className="pt-4">
        <button
          onClick={handleSendForVerification}
          disabled={!canSendForVerification || sending}
          className={`w-full py-3 rounded-lg font-semibold transition ${
            canSendForVerification && !sending
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          {sending ? "Sending..." : "Send for Verification"}
        </button>

        {!canSendForVerification && (
          <p className="text-xs text-gray-500 text-center mt-2">
            Upload all required documents to enable verification
          </p>
        )}
      </div>

      {message && (
        <p className="text-sm text-center text-gray-700 mt-2">
          {message}
        </p>
      )}
    </div>
  );
}
