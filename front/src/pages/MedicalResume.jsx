import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api.js";

/* ================= MAIN ================= */

export default function MedicalResume() {
  const [data, setData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/profile/medical-resume`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        if (!res.profile_completed) setEditMode(true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">No profile data found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10 flex justify-center">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-8">
        {editMode ? (
          <EditResume
            data={data}
            onSaved={(updated) => {
              setData(updated);
              setEditMode(false);
            }}
          />
        ) : (
          <ViewResume data={data} onEdit={() => setEditMode(true)} />
        )}
      </div>
    </div>
  );
}

/* ================= VIEW MODE ================= */

function ViewResume({ data, onEdit }) {
  return (
    <>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        🩺 Medical Resume
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResumeRow label="Role" value={data.role} />
        <ResumeRow label="Name" value={data.name} />
        <ResumeRow label="Email" value={data.email} />
        <ResumeRow label="Phone" value={data.phone} />
        <ResumeRow label="Designation" value={data.designation} />
        <ResumeRow label="Specialization" value={data.specialization} />
        <ResumeRow label="Registration Number" value={data.registration_number} />
        <ResumeRow
          label="Experience"
          value={
            data.years_of_experience
              ? `${data.years_of_experience} years`
              : "-"
          }
        />
        <ResumeRow label="Hospital / Clinic" value={data.hospital_affiliation} />
        <ResumeRow
          label="Qualifications"
          value={
            Array.isArray(data.qualifications)
              ? data.qualifications.join(", ")
              : "-"
          }
        />
        <ResumeRow
          label="Skills"
          value={Array.isArray(data.skills) ? data.skills.join(", ") : "-"}
        />
      </div>

      <div className="mt-6">
        <p className="text-sm text-gray-500 mb-1">Bio</p>
        <p className="bg-gray-50 p-4 rounded-lg text-gray-800">
          {data.bio || "-"}
        </p>
      </div>

      <button
        onClick={onEdit}
        className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
      >
        Edit Resume
      </button>
    </>
  );
}

function ResumeRow({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-800 capitalize">
        {value || "-"}
      </p>
    </div>
  );
}

/* ================= EDIT MODE ================= */

function EditResume({ data, onSaved }) {
  const [form, setForm] = useState({
    role: data.role || "",
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    designation: data.designation || "",
    specialization: data.specialization || "",
    registration_number: data.registration_number || "",
    years_of_experience: data.years_of_experience || "",
    hospital_affiliation: data.hospital_affiliation || "",
    qualifications: Array.isArray(data.qualifications)
      ? data.qualifications.join(", ")
      : "",
    skills: Array.isArray(data.skills)
      ? data.skills.join(", ")
      : "",
    bio: data.bio || "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    const payload = {
      ...form,
      years_of_experience: form.years_of_experience
        ? Number(form.years_of_experience)
        : null,
      qualifications: form.qualifications
        .split(",")
        .map((q) => q.trim())
        .filter(Boolean),
      skills: form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    delete payload.email; // 🔒 extra safety

    const res = await fetch(`${API_BASE_URL}/profile/medical-resume`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert("Failed to update profile");
      return;
    }

    const refreshed = await fetch(
      `${API_BASE_URL}/profile/medical-resume`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const updatedData = await refreshed.json();
    onSaved(updatedData);
  };

  return (
    <>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        ✏️ Edit Medical Resume
      </h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* ROLE */}
        <div>
          <label className="block text-sm text-gray-500 mb-1">Role</label>
          <select
            value={form.role}
            disabled={data.profile_completed}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value })
            }
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              data.profile_completed
                ? "bg-gray-100 cursor-not-allowed"
                : ""
            }`}
            required
          >
            <option value="">Select role</option>
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="hospital">Hospital</option>
            <option value="medical_worker">Medical Worker</option>
          </select>

          {data.profile_completed && (
            <p className="text-xs text-gray-400 mt-1">
              Role cannot be changed after profile completion
            </p>
          )}
        </div>

        <Input
          label="Name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
        />

        <Input
          label="Email"
          value={form.email}
          disabled
        />

        <Input
          label="Phone"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
        />

        <Input
          label="Designation"
          value={form.designation}
          onChange={(v) => setForm({ ...form, designation: v })}
        />

        <Input
          label="Specialization"
          value={form.specialization}
          onChange={(v) => setForm({ ...form, specialization: v })}
        />

        <Input
          label="Registration Number"
          value={form.registration_number}
          onChange={(v) =>
            setForm({ ...form, registration_number: v })
          }
        />

        <Input
          label="Years of Experience"
          type="number"
          value={form.years_of_experience}
          onChange={(v) =>
            setForm({ ...form, years_of_experience: v })
          }
        />

        <Input
          label="Hospital / Clinic"
          value={form.hospital_affiliation}
          onChange={(v) =>
            setForm({ ...form, hospital_affiliation: v })
          }
        />

        <Input
          label="Qualifications"
          value={form.qualifications}
          onChange={(v) =>
            setForm({ ...form, qualifications: v })
          }
        />

        <Input
          label="Skills"
          value={form.skills}
          onChange={(v) => setForm({ ...form, skills: v })}
        />

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-500 mb-1">Bio</label>
          <textarea
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={4}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>

        <button className="md:col-span-2 mt-4 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition">
          Save Resume
        </button>
      </form>
    </>
  );
}

/* ================= INPUT ================= */

function Input({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}) {
  return (
    <div>
      <label className="block text-sm text-gray-500 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled
            ? "bg-gray-100 cursor-not-allowed text-gray-500"
            : ""
        }`}
      />
    </div>
  );
}