import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";
import Footer from "../components/Footer";

export default function ViewJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
           <p className="text-gray-500 font-medium">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <div className="text-center p-8">
            <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">error</span>
            <p className="text-red-500 font-medium">{error}</p>
            <button
               onClick={() => navigate(-1)}
               className="mt-4 btn-secondary"
            >
               Go Back
            </button>
         </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <div className="text-center p-8">
            <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">search_off</span>
            <p className="text-gray-500 font-medium">Job not found</p>
            <button
               onClick={() => navigate(-1)}
               className="mt-4 btn-secondary"
            >
               Go Back
            </button>
         </div>
      </div>
    );
  }

  /* =========================
     RENDER
     ========================= */
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-grow py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
           <button
             onClick={() => navigate(-1)}
             className="mb-6 flex items-center gap-2 text-gray-600 hover:text-[var(--color-primary)] transition-colors text-sm font-medium"
           >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Jobs
           </button>

           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
             {/* Job Header */}
             <div className="p-8 border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                   <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                      <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                         <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[20px]">apartment</span>
                            <span className="font-medium">{job.hospital?.name}</span>
                         </div>
                         <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[20px]">location_on</span>
                            <span>{job.hospital?.city}</span>
                         </div>
                         <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[20px]">schedule</span>
                            <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                         </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                         <span className="badge bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1">
                            {job.job_type}
                         </span>
                         <span className="badge bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1">
                            {job.department}
                         </span>
                      </div>
                   </div>

                   <div className="flex flex-col gap-3 min-w-[200px]">
                      <button
                        onClick={handleApply}
                        disabled={applying || !isVerified || checkingProfile}
                        className={`btn-primary w-full py-3 text-lg flex items-center justify-center gap-2 ${
                           applying || !isVerified || checkingProfile ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {applying ? (
                           <>
                              <span className="animate-spin material-symbols-outlined text-[20px]">progress_activity</span>
                              Applying...
                           </>
                        ) : (
                           <>
                              <span className="material-symbols-outlined text-[20px]">send</span>
                              Apply Now
                           </>
                        )}
                      </button>
                      {!checkingProfile && !isVerified && (
                         <div className="text-xs text-center p-2 bg-yellow-50 text-yellow-700 rounded border border-yellow-200">
                            You must be <a href="/get-verified" className="underline font-bold">verified</a> to apply.
                         </div>
                      )}
                   </div>
                </div>
             </div>

             <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                {/* Main Content */}
                <div className="md:col-span-2 p-8 space-y-8">
                   <Section title="Job Description">
                      <div className="prose prose-gray max-w-none text-gray-600">
                         <p className="whitespace-pre-line">{job.description || "No description provided."}</p>
                      </div>
                   </Section>
                </div>

                {/* Sidebar Details */}
                <div className="p-8 bg-gray-50 space-y-6">
                   <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-4">Job Overview</h3>
                   <div className="space-y-4">
                      <DetailItem icon="payments" label="Salary" value={
                         job.min_salary && job.max_salary
                           ? `₹${job.min_salary.toLocaleString()} – ₹${job.max_salary.toLocaleString()}`
                           : "Not disclosed"
                      } />
                      <DetailItem icon="work_history" label="Experience" value={
                         job.experience_required ? `${job.experience_required} Years` : "Not specified"
                      } />
                      <DetailItem icon="medical_services" label="Department" value={job.department} />
                      <DetailItem icon="map" label="Location" value={
                         job.hospital.city
                           ? `${job.hospital.city}${job.hospital.state ? `, ${job.hospital.state}` : ""}`
                           : "—"
                      } />
                   </div>
                </div>
             </div>
           </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

/* =========================
   HELPER COMPONENT
   ========================= */

function Section({ title, children }) {
  return (
    <div>
       <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
       {children}
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="material-symbols-outlined text-gray-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-500 font-semibold uppercase mb-0.5">{label}</p>
        <p className="text-gray-900 font-medium text-sm">{value}</p>
      </div>
    </div>
  );
}
