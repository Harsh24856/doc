import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api.js";
import { useNavigate } from "react-router-dom";

export default function JobsPosted() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading jobs…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-10">

        {/* HEADER */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Jobs Posted
          </h2>
          <p className="text-gray-500 mt-2">
            Manage the jobs you have posted.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        {/* EMPTY STATE */}
        {jobs.length === 0 ? (
          <p className="text-gray-500">
            You haven’t posted any jobs yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="flex items-center justify-between border rounded-lg px-5 py-4"
              >
                <span className="text-gray-800 font-medium">
                  {job.title}
                </span>

                <button
                  className="text-sm font-medium text-blue-600 hover:underline"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  Review
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
