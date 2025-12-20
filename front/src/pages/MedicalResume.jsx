import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api.js";

export default function MedicalResume() {
  const [data, setData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  console.log('🏥 [MedicalResume] Component rendered', { loading, editMode, hasData: !!data });

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log('🏥 [MedicalResume] useEffect triggered - fetching resume');
    console.log('🔑 [MedicalResume] Token exists:', !!token);

    if (!token) {
      console.error('❌ [MedicalResume] No token found in localStorage');
      setLoading(false);
      return;
    }

    const url = `${API_BASE_URL}/profile/medical-resume`;
    console.log('📤 [MedicalResume] Making GET request to:', url);

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        console.log('📥 [MedicalResume] Response status:', res.status, res.statusText);
        console.log('📥 [MedicalResume] Response ok:', res.ok);
        
        if (!res.ok) {
          console.error('❌ [MedicalResume] Response not ok, status:', res.status);
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        return res.json();
      })
      .then((res) => {
        console.log('📥 [MedicalResume] Response data received:', res);
        console.log('📥 [MedicalResume] Profile completed:', res.profile_completed);
        
        setData(res);
        if (!res.profile_completed) {
          console.log('📝 [MedicalResume] Profile not completed, opening edit mode');
          setEditMode(true);
        } else {
          console.log('✅ [MedicalResume] Profile completed, showing view mode');
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('❌ [MedicalResume] Error fetching resume:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    console.log('⏳ [MedicalResume] Still loading...');
    return <div className="page">Loading...</div>;
  }
  
  if (!data) {
    console.warn('⚠️ [MedicalResume] No profile data available');
    return <div className="page">No profile data</div>;
  }

  console.log('🎨 [MedicalResume] Rendering', { editMode, dataKeys: Object.keys(data) });

  return (
    <div className="page">
      <div className="card wide">
        {editMode ? (
          <EditResume
            data={data}
            onSaved={(updated) => {
              console.log('💾 [MedicalResume] Resume saved, updating data:', updated);
              setData(updated);
              setEditMode(false);
            }}
          />
        ) : (
          <ViewResume 
            data={data} 
            onEdit={() => {
              console.log('✏️ [MedicalResume] Edit button clicked, switching to edit mode');
              setEditMode(true);
            }} 
          />
        )}
      </div>
    </div>
  );
}

/* ================= VIEW MODE ================= */

function ViewResume({ data, onEdit }) {
  console.log('👁️ [ViewResume] Rendering view mode with data:', data);
  
  return (
    <>
      <h2 className="title">Medical Resume</h2>

      <ResumeRow label="Role" value={data.role} />
      <ResumeRow label="Name" value={data.name} />
      <ResumeRow label="Email" value={data.email} />

      <hr className="my-4" />

      <ResumeRow label="Phone" value={data.phone} />
      <ResumeRow label="Designation" value={data.designation} />
      <ResumeRow label="Specialization" value={data.specialization} />
      <ResumeRow label="Registration Number" value={data.registration_number} />
      <ResumeRow
        label="Experience"
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
      <ResumeRow label="Bio" value={data.bio} />

      <button className="btn mt-6" onClick={onEdit}>
        Edit Resume
      </button>
    </>
  );
}

function ResumeRow({ label, value }) {
  return (
    <div className="mb-3">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium capitalize">{value || "-"}</p>
    </div>
  );
}

/* ================= EDIT MODE ================= */

function EditResume({ data, onSaved }) {
  console.log('✏️ [EditResume] Component initialized with data:', data);
  
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

  console.log('📝 [EditResume] Form state initialized:', form);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('💾 [EditResume] Form submitted with data:', form);

    const token = localStorage.getItem("token");
    if (!token) {
      console.error('❌ [EditResume] No token found in localStorage');
      alert('Authentication required. Please login again.');
      return;
    }

    const payload = {
      ...form,
      // Convert years_of_experience to number if it's a valid number
      years_of_experience: form.years_of_experience ? (isNaN(form.years_of_experience) ? form.years_of_experience : Number(form.years_of_experience)) : null,
      // Convert comma-separated strings to arrays
      qualifications: form.qualifications ? form.qualifications.split(",").map((q) => q.trim()).filter(q => q) : [],
      skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(s => s) : [],
    };

    console.log('📤 [EditResume] Prepared payload:', payload);
    console.log('📤 [EditResume] Role in payload:', payload.role);

    try {
      const url = `${API_BASE_URL}/profile/medical-resume`;
      console.log('📤 [EditResume] Making PUT request to:', url);

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('📥 [EditResume] Response status:', res.status, res.statusText);
      
      const responseData = await res.json();
      console.log('📥 [EditResume] Response data:', responseData);

      if (!res.ok) {
        console.error('❌ [EditResume] Update failed:', responseData);
        alert(responseData.message || responseData.error || 'Failed to update resume');
        return;
      }

      console.log('✅ [EditResume] Resume updated successfully');
      
      // Refetch the updated data from backend to ensure consistency
      const fetchUrl = `${API_BASE_URL}/profile/medical-resume`;
      console.log('🔄 [EditResume] Refetching updated data from:', fetchUrl);
      
      const fetchRes = await fetch(fetchUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (fetchRes.ok) {
        const updatedData = await fetchRes.json();
        console.log('✅ [EditResume] Refetched updated data:', updatedData);
        onSaved(updatedData);
      } else {
        // If refetch fails, use local data as fallback
        console.warn('⚠️ [EditResume] Failed to refetch, using local data');
        const updatedData = { ...data, ...form, profile_completed: true };
        onSaved(updatedData);
      }
    } catch (error) {
      console.error('❌ [EditResume] Error updating resume:', error);
      alert('An error occurred while updating the resume. Please try again.');
    }
  };

  return (
    <>
      <h2 className="title">Edit Medical Resume</h2>

      <form onSubmit={handleSubmit}>
        {/* ROLE */}
        <label className="block mb-1 font-medium">Select Role</label>
        <select
          className="input"
          value={form.role}
          onChange={(e) => {
            console.log('🔄 [EditResume] Role changed to:', e.target.value);
            setForm({ ...form, role: e.target.value });
          }}
          required
        >
          <option value="">-- Select Role --</option>
          <option value="doctor">Doctor</option>
          <option value="nurse">Nurse</option>
          <option value="hospital">Hospital</option>
          <option value="medical_worker">Medical Worker</option>
        </select>

        <input className="input" placeholder="Name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />

        <input className="input" placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />

        <input className="input" placeholder="Phone" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })} />

        <input className="input" placeholder="Designation" value={form.designation}
          onChange={(e) => setForm({ ...form, designation: e.target.value })} />

        <input className="input" placeholder="Specialization" value={form.specialization}
          onChange={(e) => setForm({ ...form, specialization: e.target.value })} />

        <input className="input" placeholder="Registration Number" value={form.registration_number}
          onChange={(e) => setForm({ ...form, registration_number: e.target.value })} />

        <input className="input" type="number" placeholder="Years of Experience" value={form.years_of_experience}
          onChange={(e) => setForm({ ...form, years_of_experience: e.target.value })} />

        <input className="input" placeholder="Hospital / Clinic Affiliation" value={form.hospital_affiliation}
          onChange={(e) => setForm({ ...form, hospital_affiliation: e.target.value })} />

        <input className="input" placeholder="Qualifications (comma separated)" value={form.qualifications}
          onChange={(e) => setForm({ ...form, qualifications: e.target.value })} />

        <input className="input" placeholder="Skills (comma separated)" value={form.skills}
          onChange={(e) => setForm({ ...form, skills: e.target.value })} />

        <textarea className="input" placeholder="Bio" value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })} />

        <button className="btn">Save Resume</button>
      </form>
    </>
  );
}