import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";

export default function GetVerified() {
  const navigate = useNavigate();
  const [licensePdf, setLicensePdf] = useState(null);
  const [idPdf, setIdPdf] = useState(null);
  const [registrationCouncil, setRegistrationCouncil] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationData, setVerificationData] = useState(null);

  /* =========================
     CHECK PROFILE COMPLETION & VERIFICATION STATUS
     ========================= */
  useEffect(() => {
    const checkProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/profile/medical-resume`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await res.json();

        // If profile is not completed, redirect to resume page
        if (!data.profile_completed) {
          navigate("/resume", { replace: true });
          return;
        }

        // Store verification status and data
        const status = data.verification_status || null;
        setVerificationStatus(status);
        setVerificationData(data);
        setRegistrationCouncil(data.registration_council || "");

        // Profile is completed, allow access
        setCheckingProfile(false);
      } catch (err) {
        console.error("[GetVerified] Error checking profile:", err);
        // On error, redirect to resume to be safe
        navigate("/resume", { replace: true });
      }
    };

    checkProfile();
  }, [navigate]);

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
      // Refresh verification status
      const refreshRes = await fetch(`${API_BASE_URL}/profile/medical-resume`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setVerificationStatus(refreshData.verification_status || "pending");
        setVerificationData(refreshData);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking profile completion
  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--color-accent)] via-white to-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600">Checking profile completion...</p>
        </div>
      </div>
    );
  }

  // Determine if form should be shown (only if status is null/not_submitted)
  const showForm = !verificationStatus || verificationStatus === "not_submitted";

  // Get status display info
  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return {
          text: "Under Process",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: "⏳",
        };
      case "approved":
        return {
          text: "Verified",
          color: "bg-green-100 text-green-800 border-green-200",
          icon: "✅",
        };
      case "rejected":
        return {
          text: "Rejected",
          color: "bg-red-100 text-red-800 border-red-200",
          icon: "❌",
        };
      default:
        return {
          text: "Not Submitted",
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: "📋",
        };
    }
  };

  const statusInfo = getStatusInfo(verificationStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-accent)] via-white to-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          🛡️ Get Verified
        </h2>
        <p className="text-center text-gray-500 mb-8">
          {showForm
            ? "Upload your documents to verify your medical credentials"
            : "Your verification status"}
        </p>

        {/* STATUS BADGE */}
        {!showForm && (
          <div className="mb-6 text-center">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${statusInfo.color} font-semibold`}
            >
              <span>{statusInfo.icon}</span>
              <span>{statusInfo.text}</span>
            </div>
          </div>
        )}

        {showForm ? (
          /* =========================
             FORM (NOT SUBMITTED)
             ========================= */
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
                  file:bg-[var(--color-accent)] file:text-[var(--color-primary-dark)]
                  hover:file:bg-red-100
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
                  file:bg-[var(--color-accent)] file:text-[var(--color-primary-dark)]
                  hover:file:bg-red-100
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
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white transition ${
                loading
                  ? "bg-[var(--color-primary-dark)] opacity-60 cursor-not-allowed"
                  : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]"
              }`}
            >
              {loading ? "Submitting..." : "Submit for Verification"}
            </button>
          </form>
        ) : (
          /* =========================
             FILLED VIEW (SUBMITTED)
             ========================= */
          <div className="space-y-6">
            {/* LICENSE */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Medical License (PDF)
              </label>
              <div className="px-4 py-3 bg-gray-50 border rounded-lg text-sm text-gray-700">
                {verificationData?.license_doc_url ? "✓ Document uploaded" : "No document"}
              </div>
            </div>

            {/* ID */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                ID Proof (PDF)
              </label>
              <div className="px-4 py-3 bg-gray-50 border rounded-lg text-sm text-gray-700">
                {verificationData?.id_doc_url ? "✓ Document uploaded" : "No document"}
              </div>
            </div>

            {/* REG COUNCIL */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Registration Council
              </label>
              <div className="px-4 py-3 bg-gray-50 border rounded-lg text-sm text-gray-700">
                {verificationData?.registration_council || "Not provided"}
              </div>
            </div>

            {/* STATUS MESSAGE */}
            {verificationStatus === "pending" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
                <p className="font-semibold mb-1">⏳ Verification Under Process</p>
                <p>Your documents are being reviewed. You will be notified once the verification is complete.</p>
              </div>
            )}
            {verificationStatus === "approved" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm">
                <p className="font-semibold mb-1">✅ Verification Approved</p>
                <p>Your account has been verified successfully!</p>
              </div>
            )}
            {verificationStatus === "rejected" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                <p className="font-semibold mb-1">❌ Verification Rejected</p>
                <p>Your verification request was rejected. Please contact support for more information.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}