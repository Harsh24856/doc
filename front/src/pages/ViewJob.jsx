import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API_BASE_URL from "../config/api.js";

export default function ViewJob() {
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Check if user profile is completed
  useEffect(() => {
    const checkProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setCheckingProfile(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/profile/medical-resume`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setProfileCompleted(data.profile_completed || false);
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
    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
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
    if (!profileCompleted) {
      alert("⚠️ Please complete your profile before applying for jobs. Go to Resume page to complete your profile.");
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 sm:py-8 md:py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        {/* MAIN CARD */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-8">
          {/* HEADER SECTION */}
          <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] px-10 py-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  {job.title}
                </h1>
                <p className="text-red-100 text-sm">
                  Posted on {new Date(job.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
              </div>
              <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center text-4xl shadow-lg">
                💼
              </div>
            </div>
          </div>

          <div className="p-10">
            {/* DETAILS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
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
            <div className="mb-6 pb-10 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">📝</span>
                <h3 className="text-2xl font-bold text-gray-800">Job Description</h3>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed text-lg">
                  {job.description || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* APPLY SECTION */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-10">
          {!checkingProfile && !profileCompleted && (
            <div className="mb-8 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="text-3xl">⚠️</span>
                <div className="flex-1">
                  <p className="font-bold text-yellow-900 mb-2 text-lg">Profile Incomplete</p>
                  <p className="text-sm text-yellow-800 mb-4">
                    Please complete your profile before applying for jobs.
                  </p>
                  <a 
                    href="/resume" 
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition duration-300"
                  >
                    Complete Profile →
                  </a>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-end gap-5">
            <button
              onClick={() => window.history.back()}
              className="px-8 py-3.5 rounded-2xl font-semibold text-gray-700 border-2 border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:scale-105"
            >
              ← Back
            </button>
            <button
              onClick={handleApply}
              disabled={applying || !profileCompleted || checkingProfile}
              className={`px-10 py-3.5 rounded-2xl font-semibold transition-all duration-300 text-white flex items-center gap-2
                ${applying || !profileCompleted || checkingProfile
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
              ) : !profileCompleted ? (
                "Complete Profile to Apply"
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
    <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-300">
      {icon && <span className="text-3xl">{icon}</span>}
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
        <p className="text-lg font-bold text-gray-900">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}