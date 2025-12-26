import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";

export default function HospJobData() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [job, setJob] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);

  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= FETCH JOB ================= */
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch job");

        setJob(data.job);
        setForm(data.job);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, token]);

  /* ================= FETCH APPLICANTS ================= */
  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/jobs/${jobId}/applicants`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        setApplicants(data.applicants || []);
      } catch (err) {
        console.error("Applicants fetch error:", err.message);
      } finally {
        setLoadingApplicants(false);
      }
    };

    fetchApplicants();
  }, [jobId, token]);

  /* ================= UPDATE JOB ================= */
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
      if (!res.ok) throw new Error(data.message);

      setJob(data.job);
      setEditing(false);
    } catch (err) {
      alert(err.message);
    }
  };

  /* ================= UI STATES ================= */
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

        {/* ================= HEADER ================= */}
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

        {/* ================= VIEW MODE ================= */}
        {!editing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
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

            <div className="md:col-span-2">
              <p className="text-gray-500 mb-1">Job Description</p>
              <p className="text-gray-800 whitespace-pre-line">
                {job.description || "—"}
              </p>
            </div>
          </div>
        )}

        {/* ================= EDIT MODE ================= */}
        {editing && (
          <form
            onSubmit={handleUpdate}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <Input label="Job Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <Input label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
            <Input label="Job Type" value={form.job_type} onChange={(v) => setForm({ ...form, job_type: v })} />
            <Input label="Experience Required" value={form.experience_required} onChange={(v) => setForm({ ...form, experience_required: v })} />
            <Input label="Minimum Salary" type="number" value={form.min_salary} onChange={(v) => setForm({ ...form, min_salary: v })} />
            <Input label="Maximum Salary" type="number" value={form.max_salary} onChange={(v) => setForm({ ...form, max_salary: v })} />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Job Description
              </label>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* ================= APPLICANTS ================= */}
        <div className="mt-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            Applicants
          </h3>

          {loadingApplicants ? (
            <p className="text-gray-500">Loading applicants…</p>
          ) : applicants.length === 0 ? (
            <p className="text-gray-500">No applications yet</p>
          ) : (
            <div className="space-y-4">
              {applicants.map((a) => {
                const status = a.users?.verification_status || a.verification_status || "pending";
                const statusColors = {
                  approved: "bg-green-100 text-green-800 border-green-200",
                  rejected: "bg-red-100 text-red-800 border-red-200",
                  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
                };
                const statusLabels = {
                  approved: "✓ Approved",
                  rejected: "✗ Rejected",
                  pending: "⏳ Pending",
                };

                return (
                  <div
                    key={a.id}
                    className="p-4 border rounded-xl hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        onClick={() => navigate(`/profile/${a.users.id}`)}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-800">
                            {a.users?.name || "Unknown"}
                          </p>
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${statusColors[status] || statusColors.pending}`}
                          >
                            {statusLabels[status] || "Pending"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {a.users?.designation || "—"}
                          {a.users?.specialization ? ` • ${a.users.specialization}` : ""}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Applied on{" "}
                          {a.applied_at
                            ? new Date(a.applied_at).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/resume/${a.users.id}`);
                        }}
                        className="ml-4 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition"
                      >
                        View Resume
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ================= HELPERS ================= */

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value || "—"}</p>
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
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}