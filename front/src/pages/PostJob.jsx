import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";

export default function PostJob() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    title: "",
    department: "",
    job_type: "",
    experience_required: "",
    min_salary: "",
    max_salary: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [hospitalData, setHospitalData] = useState(null);

  // Fetch hospital data and check verification status
  useEffect(() => {
    const fetchHospitalData = async () => {
      if (!token) {
        setCheckingVerification(false);
        return;
      }

      try {
        // Fetch hospital information
        const hospitalRes = await fetch(`${API_BASE_URL}/hospital/fetch`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (hospitalRes.ok) {
          const hospitalInfo = await hospitalRes.json();
          setHospitalData(hospitalInfo);
        }

        // Check verification status
        const statusRes = await fetch(`${API_BASE_URL}/hospital/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setVerificationStatus(statusData.verification_status);
        }
      } catch (err) {
        console.error("Error fetching hospital data:", err);
      } finally {
        setCheckingVerification(false);
      }
    };

    fetchHospitalData();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Check if hospital is verified (accept both "verified" and "approved")
    const isVerified = verificationStatus === "verified" || verificationStatus === "approved";
    if (!isVerified) {
      setError("⚠️ Your hospital must be verified before posting jobs. Please complete verification first.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          min_salary: Number(form.min_salary),
          max_salary: Number(form.max_salary),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to post job");
      }

      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* HEADER SECTION */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] mb-4 shadow-lg">
            <span className="text-3xl">💼</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Post Job Opening
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create a compelling job posting to attract top medical talent
          </p>
        </div>

        {/* HOSPITAL INFO CARD */}
        {hospitalData && hospitalData.hospital_name && (
          <div className="mb-6 bg-gradient-to-r from-[var(--color-accent)] to-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-lg shadow-md">
                {hospitalData.hospital_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Posting as</p>
                <p className="text-lg font-bold text-gray-900">
                  {hospitalData.hospital_name}
                </p>
                {hospitalData.hospital_city && hospitalData.hospital_state && (
                  <p className="text-sm text-gray-600 mt-1">
                    📍 {hospitalData.hospital_city}, {hospitalData.hospital_state}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VERIFICATION STATUS */}
        {!checkingVerification && verificationStatus !== "verified" && verificationStatus !== "approved" && (
          <div className="mb-6 bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-400 rounded-lg p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="font-bold text-yellow-900 mb-1">Verification Required</p>
                <p className="text-sm text-yellow-800 mb-2">Your hospital must be verified before posting jobs.</p>
                <p className="text-sm text-yellow-700 mb-3">
                  Status: <span className="font-semibold capitalize">{verificationStatus || "Not Verified"}</span>
                </p>
                <a 
                  href="/hospital-profile" 
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition"
                >
                  Complete Verification →
                </a>
              </div>
            </div>
          </div>
        )}
        {!checkingVerification && (verificationStatus === "verified" || verificationStatus === "approved") && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-bold text-green-900">Hospital Verified</p>
                <p className="text-sm text-green-700">You're all set to post jobs!</p>
              </div>
            </div>
          </div>
        )}

        {/* MAIN FORM CARD */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Job Details</h2>
            <p className="text-red-100 mt-1">Fill in the information below</p>
          </div>

          <div className="p-8">

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Job Title"
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
          />

          <Input
            label="Department"
            value={form.department}
            onChange={(v) => setForm({ ...form, department: v })}
          />

          <Select
            label="Job Type"
            value={form.job_type}
            onChange={(v) => setForm({ ...form, job_type: v })}
          />

          <Input
            label="Experience Required"
            value={form.experience_required}
            onChange={(v) =>
              setForm({ ...form, experience_required: v })
            }
          />

          <Input
            label="Minimum Salary"
            type="number"
            value={form.min_salary}
            onChange={(v) =>
              setForm({ ...form, min_salary: v })
            }
          />

          <Input
            label="Maximum Salary"
            type="number"
            value={form.max_salary}
            onChange={(v) =>
              setForm({ ...form, max_salary: v })
            }
          />

              </div>

              {/* DESCRIPTION (FULL WIDTH) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Describe the role, responsibilities, requirements, and benefits..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all
                             focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20
                             bg-gray-50 focus:bg-white resize-none"
                />
              </div>

              {/* ERROR */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate("/posted-jobs")}
                  className="px-6 py-3 rounded-xl font-semibold text-gray-700 border-2 border-gray-300 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || checkingVerification || (verificationStatus !== "verified" && verificationStatus !== "approved")}
                  className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] 
                           hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                           flex items-center gap-2"
                >
                  {checkingVerification ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Checking Verification...
                    </>
                  ) : loading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Posting…
                    </>
                  ) : (verificationStatus !== "verified" && verificationStatus !== "approved") ? (
                    "Verification Required"
                  ) : (
                    <>
                      <span>✨</span>
                      Post Job Opening
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/* INPUT COMPONENT */
function Input({ label, value, onChange, type = "text", required }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all
                   focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20
                   bg-gray-50 focus:bg-white hover:border-gray-300"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </div>
  );
}

/* SELECT COMPONENT */
function Select({ label, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all
                   focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20
                   bg-gray-50 focus:bg-white hover:border-gray-300 cursor-pointer"
      >
        <option value="">Select job type</option>
        <option value="full-time">Full-time</option>
        <option value="part-time">Part-time</option>
        <option value="contract">Contract</option>
      </select>
    </div>
  );
}
