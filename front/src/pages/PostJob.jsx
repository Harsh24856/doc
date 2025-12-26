import { useState } from "react";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-10">

        {/* HEADER */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Post Job Opening
          </h2>
          <p className="text-gray-500 mt-2">
            Fill in the details below to create a new job opening.
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
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

          {/* DESCRIPTION (FULL WIDTH) */}
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

          {/* ERROR */}
          {error && (
            <div className="md:col-span-2">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* SUBMIT */}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition disabled:bg-gray-400"
            >
              {loading ? "Posting…" : "Post Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* INPUT COMPONENT */
function Input({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>
      <input
        type={type}
        className="w-full px-4 py-2 border rounded-lg transition
                   focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/* SELECT COMPONENT */
function Select({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg transition
                   focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">Select job type</option>
        <option value="full-time">Full-time</option>
        <option value="part-time">Part-time</option>
        <option value="contract">Contract</option>
      </select>
    </div>
  );
}
