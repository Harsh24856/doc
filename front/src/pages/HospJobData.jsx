import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API_BASE_URL from "../config/api.js";

export default function HospJobData() {
  const { jobId } = useParams();
  const token = localStorage.getItem("token");

  const [job, setJob] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* Fetch job details */
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch job details");
        }

        setJob(data.job);
        setForm(data.job); // pre-fill form
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, token]);

  /* Update job */
  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: "PATCH",
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
        throw new Error(data.message || "Failed to update job");
      }

      setJob(data.job);
      setEditing(false);
    } catch (err) {
      alert(err.message);
    }
  };

  /* UI states */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading job details…
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

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-10">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            {editing ? "Edit Job" : job.title}
          </h2>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition"
            >
              Edit Job
            </button>
          )}
        </div>

        {/* VIEW MODE */}
        {!editing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <DetailItem label="Department" value={job.department} />
            <DetailItem label="Job Type" value={job.job_type} />
            <DetailItem
              label="Experience Required"
              value={job.experience_required}
            />
            <DetailItem
              label="Salary Range"
              value={
                job.min_salary && job.max_salary
                  ? `₹${job.min_salary} – ₹${job.max_salary}`
                  : "—"
              }
            />

            <div className="md:col-span-2">
              <p className="text-gray-500 mb-1">Job Description</p>
              <p className="text-gray-800 whitespace-pre-line">
                {job.description || "—"}
              </p>
            </div>
          </div>
        )}

        {/* EDIT MODE */}
        {editing && (
          <form
            onSubmit={handleUpdate}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
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

            <Input
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Job Description
              </label>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg transition
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setForm(job);
                }}
                className="px-6 py-2 rounded-lg border text-gray-600"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

/* Helper components */

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

function Input({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>
      <input
        type={type}
        className="w-full px-4 py-2 border rounded-lg transition
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
