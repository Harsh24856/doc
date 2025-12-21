import { useState } from "react";
import API_BASE_URL from "../config/api.js";

export default function GetVerified() {
  const [licensePdf, setLicensePdf] = useState(null);
  const [idPdf, setIdPdf] = useState(null);
  const [registrationCouncil, setRegistrationCouncil] = useState("");
  const [loading, setLoading] = useState(false);

  /* =========================
     UPLOAD FILES
     ========================= */
  const uploadFiles = async () => {
    const formData = new FormData();
    formData.append("license", licensePdf);
    formData.append("id", idPdf);

    const res = await fetch(`${API_BASE_URL}/verification/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Upload failed");
    }

    return data;
  };

  /* =========================
     SUBMIT VERIFICATION
     ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const upload = await uploadFiles();

      const res = await fetch(`${API_BASE_URL}/verification/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...upload,
          registration_council: registrationCouncil,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      alert("Verification submitted successfully. Status: Pending");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          🛡️ Get Verified
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Upload your documents to verify your medical credentials
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* LICENSE */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Medical License (PDF)
            </label>
            <input
              type="file"
              accept="application/pdf"
              required
              onChange={(e) => setLicensePdf(e.target.files[0])}
              className="block w-full text-sm text-gray-600
                file:mr-4 file:py-2.5 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
            />
          </div>

          {/* ID */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              ID Proof (PDF)
            </label>
            <input
              type="file"
              accept="application/pdf"
              required
              onChange={(e) => setIdPdf(e.target.files[0])}
              className="block w-full text-sm text-gray-600
                file:mr-4 file:py-2.5 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
            />
          </div>

          {/* REG COUNCIL */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Registration Council
            </label>
            <input
              type="text"
              placeholder="e.g. Medical Council of India"
              required
              value={registrationCouncil}
              onChange={(e) => setRegistrationCouncil(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            {loading ? "Submitting..." : "Submit for Verification"}
          </button>
        </form>
      </div>
    </div>
  );
}