import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";

export default function ViewJob() {
  const navigate = useNavigate();
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  // Check if user is verified
  useEffect(() => {
    const checkProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setCheckingProfile(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/get-status/doctor`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
        throw new Error("Unauthorized");
    }

        if (res.ok) {
          const data = await res.json();
          setIsVerified(data.status === "approved" || false);
        }
      } catch (err) {
        console.error("Error checking profile:", err);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfile();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`,{
          headers: {Authorization : `Bearer ${token}`},
        });
          if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
        throw new Error("Unauthorized");
        }
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch job");
        }

        setJob(data.job);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  /* =========================
     APPLY HANDLER
     ========================= */
  const handleApply = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login to apply for this job");
      return;
    }

    // Check if profile is completed
    if (!isVerified) {
      alert("⚠️ You need to be verified before applying for a job");
      return;
    }

    try {
      setApplying(true);

      const res = await fetch(
        `${API_BASE_URL}/applications/apply/${jobId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to apply");
        return;
      }

      alert("✅ Applied successfully!");
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  /* =========================
     UI STATES
     ========================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-500">Loading job details…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-500 font-semibold">Job not found</p>
        </div>
      </div>
    );
  }

  /* =========================
     RENDER
     ========================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-4 sm:py-6 md:py-8 lg:py-12 px-3 sm:px-4 md:px-6">
      <div className="max-w-5xl mx-auto">

        {/* MAIN CARD */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-6 sm:mb-8">
          {/* HEADER SECTION */}
          <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] px-4 sm:px-6 md:px-10 py-6 sm:py-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3 break-words">
                  {job.title}
                </h1>
                <p className="text-red-100 text-xs sm:text-sm">
                  Posted on {new Date(job.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-white/20 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl shadow-lg flex-shrink-0">
                💼
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-10">
            {/* DETAILS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 md:mb-10">
              <DetailItem icon="🏥" label="Department" value={job.department} />
              <DetailItem icon="💼" label="Job Type" value={job.job_type} />
              <DetailItem icon="⭐" label="Experience Required" value={job.experience_required} />
              <DetailItem
                icon="💰"
                label="Salary Range"
                value={
                  job.min_salary && job.max_salary
                    ? `₹${job.min_salary.toLocaleString()} – ₹${job.max_salary.toLocaleString()}`
                    : "—"
                }
              />
              {job.hospital && (
                <>
                  <DetailItem icon="🏥" label="Hospital" value={job.hospital.name} />
                  <DetailItem 
                    icon="📍"
                    label="Location" 
                    value={
                      job.hospital.city 
                        ? `${job.hospital.city}${job.hospital.state ? `, ${job.hospital.state}` : ""}`
                        : "—"
                    } 
                  />
                </>
              )}
            </div>

            {/* DESCRIPTION */}
            <div className="mb-4 sm:mb-6 pb-6 sm:pb-8 md:pb-10 border-b border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-5">
                <span className="text-xl sm:text-2xl">📝</span>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Job Description</h3>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed text-sm sm:text-base md:text-lg">
                  {job.description || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* APPLY SECTION */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 p-4 sm:p-6 md:p-10">
          {!checkingProfile && !isVerified && (
            <div className="mb-4 sm:mb-6 md:mb-8 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="text-2xl sm:text-3xl flex-shrink-0">⚠️</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-yellow-900 mb-2 text-base sm:text-lg">Not Verified</p>
                  <p className="text-xs sm:text-sm text-yellow-800 mb-3 sm:mb-4">
                    You need to be verified before applying for a job
                  </p>
                  <a 
                    href="/get-verified" 
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition duration-300"
                  >
                    Get Verified →
                  </a>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 md:gap-5">
            <button
              onClick={() => window.history.back()}
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 md:py-3.5 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base text-gray-700 border-2 border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:scale-105"
            >
              ← Back
            </button>
            <button
              onClick={handleApply}
              disabled={applying || !isVerified || checkingProfile}
              className={`w-full sm:w-auto px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-3.5 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base transition-all duration-300 text-white flex items-center justify-center gap-2
                ${applying || !isVerified || checkingProfile
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] hover:shadow-2xl hover:scale-105"}
              `}
            >
              {checkingProfile ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Checking...
                </>
              ) : applying ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Applying…
                </>
              ) : !isVerified ? (
                "Get Verified to Apply"
              ) : (
                <>
                  <span>✨</span>
                  Apply Now
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* =========================
   HELPER COMPONENT
   ========================= */
function DetailItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-gray-50 rounded-xl sm:rounded-2xl hover:bg-gray-100 transition-all duration-300">
      {icon && <span className="text-2xl sm:text-3xl flex-shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">{label}</p>
        <p className="text-sm sm:text-base md:text-lg font-bold text-gray-900 break-words">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}