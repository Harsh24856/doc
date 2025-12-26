import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API_BASE_URL from "../config/api.js";

export default function ViewJob() {
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading job…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Job not found
      </div>
    );
  }

  /* =========================
     RENDER
     ========================= */
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-10">

        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            {job.title}
          </h2>
          <p className="text-gray-500 mt-1">
            Posted on {new Date(job.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-8">
          <DetailItem label="Department" value={job.department} />
          <DetailItem label="Job Type" value={job.job_type} />
          <DetailItem label="Experience Required" value={job.experience_required} />
          <DetailItem
            label="Salary Range"
            value={
              job.min_salary && job.max_salary
                ? `₹${job.min_salary} – ₹${job.max_salary}`
                : "—"
            }
          />
        </div>

        {/* DESCRIPTION */}
        <div className="mb-10">
          <p className="text-gray-500 mb-2">Job Description</p>
          <p className="text-gray-800 whitespace-pre-line">
            {job.description || "—"}
          </p>
        </div>

        {/* APPLY BUTTON */}
        <div className="flex justify-end">
          <button
            onClick={handleApply}
            disabled={applying}
            className={`px-8 py-3 rounded-lg font-semibold transition text-white
              ${applying
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"}
            `}
          >
            {applying ? "Applying…" : "Apply Now"}
          </button>
        </div>

      </div>
    </div>
  );
}

/* =========================
   HELPER COMPONENT
   ========================= */
function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">
        {value || "—"}
      </p>
    </div>
  );
}