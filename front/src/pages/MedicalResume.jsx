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
      setEditMode(false);
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
  
  const isEditLocked =
  data?.verification_status === "pending" ||
  data?.verification_status === "approved";

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 py-6 sm:py-8 md:py-10 flex justify-center">
      <div className="w-full max-w-5xl bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
        {isEditLocked && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            {data.verification_status === "pending"
             ? "Your profile is currently under verification. Editing is temporarily disabled."
             : "Your profile has been verified. Editing is no longer allowed."}
          </div>
        )}

        {!data.profile_completed && (
          <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-yellow-50 text-yellow-800 rounded-lg text-xs sm:text-sm">
            Your profile is not complete. Please fill and submit.
          </div>
        )}

        {editMode ? (
          <EditResume
            data={data}
            onSaved={(updated) => {
              setData(updated);
              setEditMode(false);
            }}
          />
        ) : (
          <ViewResume
           data={data}
           onEdit={() => setEditMode(true)}
           editLocked={isEditLocked}
          />
        )}
      </div>
    </div>
  );
}

/* ================= VIEW MODE ================= */

function ViewResume({ data, onEdit, editLocked }) {
  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
        🩺 Medical Resume
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <ResumeRow label="Role" value={data.role} />
        <ResumeRow label="Name" value={data.name} />
        <ResumeRow label="Email" value={data.email} />
        <ResumeRow label="Phone" value={data.phone} />
        <ResumeRow label="Designation" value={data.designation} />
        <ResumeRow label="Specialization" value={data.specialization} />
        <ResumeRow label="Registration Number" value={data.registration_number} />
        <ResumeRow label="Year of Graduation" value={data.year_of_graduation || "-"} />
        <ResumeRow
          label="Years of Experience"
          value={data.years_of_experience ? `${data.years_of_experience} years` : "-"}
        />
        <ResumeRow label="Hospital / Clinic" value={data.hospital_affiliation} />
        <ResumeRow
          label="Qualifications"
          value={Array.isArray(data.qualifications) ? data.qualifications.join(", ") : "-"}
        />
        <ResumeRow
          label="Skills"
          value={Array.isArray(data.skills) ? data.skills.join(", ") : "-"}
        />
      </div>

      <div className="mt-4 sm:mt-6">
        <p className="text-xs sm:text-sm text-gray-500 mb-1">Bio</p>
        <p className="bg-gray-50 p-3 sm:p-4 rounded-lg text-gray-800 text-sm sm:text-base">
          {data.bio || "-"}
        </p>
      </div>

      <button
        onClick={onEdit}
        disabled={editLocked}
        className={`mt-6 sm:mt-8 w-full py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition
        ${
           editLocked
           ? "bg-gray-300 text-gray-600 cursor-not-allowed"
            : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white"
         }
         `}
      >
        Edit Resume
      </button>
    </>
  );
}

function ResumeRow({ label, value }) {
  return (
    <div>
      <p className="text-xs sm:text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-800 capitalize text-sm sm:text-base">
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
    year_of_graduation: data.year_of_graduation || "",
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
      year_of_graduation: form.year_of_graduation ? Number(form.year_of_graduation) : null,
      years_of_experience: form.years_of_experience ? Number(form.years_of_experience) : null,
      qualifications: form.qualifications.split(",").map(q => q.trim()).filter(Boolean),
      skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
      submit: true, // 🔒 ALWAYS submit
    };

    delete payload.email;

    const res = await fetch(`${API_BASE_URL}/profile/medical-resume`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert("Failed to submit profile");
      return;
    }

    const refreshed = await fetch(`${API_BASE_URL}/profile/medical-resume`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const updatedData = await refreshed.json();

    alert("Profile submitted successfully!");
    onSaved(updatedData);
  };

  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
        ✏️ Edit Medical Resume
      </h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"
      >
        {/* Role - Select Field */}
        <div>
          <label className="block text-xs sm:text-sm text-gray-500 mb-1">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            required
          >
            <option value="">Select role</option>
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="medical_worker">Medical Worker</option>
          </select>
        </div>

        <Input label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} required />
        <Input label="Email" value={form.email} disabled />
        <Input label="Phone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} required />
        <Input label="Designation" value={form.designation} onChange={v => setForm({ ...form, designation: v })} required />
        <Input label="Specialization" value={form.specialization} onChange={v => setForm({ ...form, specialization: v })} required />
        <Input label="Registration Number" value={form.registration_number} onChange={v => setForm({ ...form, registration_number: v })} required />
        <Input label="Year of Graduation" type="number" value={form.year_of_graduation} onChange={v => setForm({ ...form, year_of_graduation: v })} required />
        <Input label="Years of Experience" type="number" value={form.years_of_experience} onChange={v => setForm({ ...form, years_of_experience: v })} required />
        <Input label="Hospital / Clinic" value={form.hospital_affiliation} onChange={v => setForm({ ...form, hospital_affiliation: v })} required />
        <Input label="Qualifications" value={form.qualifications} onChange={v => setForm({ ...form, qualifications: v })} required />
        <Input label="Skills" value={form.skills} onChange={v => setForm({ ...form, skills: v })} required />

        <div className="md:col-span-2">
          <label className="block text-xs sm:text-sm text-gray-500 mb-1">
            Bio <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            rows={4}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            required
          />
        </div>

        <div className="md:col-span-2 mt-3 sm:mt-4">
          <button
            type="submit"
            className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition"
          >
            Submit Profile
          </button>
        </div>
      </form>
    </>
  );
}

/* ================= INPUT ================= */

function Input({ label, value, onChange, type = "text", disabled = false, required = false }) {
  return (
    <div>
      <label className="block text-xs sm:text-sm text-gray-500 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        required={required}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
}