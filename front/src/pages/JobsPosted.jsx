import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api.js";
import { useNavigate } from "react-router-dom";

export default function JobsPosted() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const fetchJobTitles = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/jobs/titles`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch jobs");
        }

        setJobs(data.jobs || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobTitles();
  }, [token]);

  const handleDelete = async (jobId, jobTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(jobId);
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete job");
      }

      // Remove job from list
      setJobs(jobs.filter((job) => job.id !== jobId));
    } catch (err) {
      setError(err.message);
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-gray-400 mb-4 block animate-spin">hourglass_empty</span>
          <p className="text-gray-500">Loading jobs…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] mb-6 shadow-2xl">
            <span className="material-symbols-outlined text-5xl text-white">local_hospital</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Jobs Posted
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage and review the jobs you have posted
          </p>
        </div>

        {/* MAIN CARD */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-10">

          {/* ERROR */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-2xl p-5">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* EMPTY STATE */}
          {jobs.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-6xl text-gray-400 mb-4 block">work_off</span>
              <p className="text-xl font-semibold text-gray-800 mb-2">
                No jobs posted yet
              </p>
              <p className="text-gray-500 mb-6">
                Start by posting your first job opening
              </p>
              <button
                onClick={() => navigate("/post-job")}
                className="px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-2xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center gap-2 mx-auto"
              >
                <span className="material-symbols-outlined">add</span>
                Post Your First Job
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="group relative bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-3xl p-6 hover:border-[var(--color-primary)] hover:shadow-xl transition-all duration-300 ease-in-out cursor-pointer"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] 
                                   flex items-center justify-center text-white shadow-lg">
                        <span className="material-symbols-outlined text-2xl">local_hospital</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition duration-300">
                          {job.title}
                        </h3>
                        {job.department && (
                          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">medical_services</span>
                            {job.department}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-primary-dark)] rounded-xl font-semibold text-sm hover:bg-[var(--color-primary)] hover:text-white transition-all duration-300 flex items-center gap-2"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Review
                      </button>
                      <button
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        onClick={() => handleDelete(job.id, job.title)}
                        disabled={deleting === job.id}
                      >
                        {deleting === job.id ? (
                          <>
                            <span className="material-symbols-outlined text-sm animate-spin">hourglass_empty</span>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-sm">delete</span>
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
