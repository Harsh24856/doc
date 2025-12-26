import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api.js";
import HospitalDocUpload from "../components/HospitalDocUpload.jsx";

export default function HospitalProfile() {
  const [form, setForm] = useState({
    hospital_name: "",
    hospital_type: "",
    registration_number_hospital: "",
    hospital_city: "",
    hospital_state: "",
    hospital_person_name: "",
    hospital_person_email: "",
    hospital_website: "",
  });

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  /* VERIFICATION STATUS (NEW, SEPARATE LOGIC) */
  const [verificationStatus, setVerificationStatus] = useState(null);
  

  const token = localStorage.getItem("token");

  /* EXISTING PROFILE FETCH (UNCHANGED) */
  useEffect(() => {
    const fetchHospitalProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/hospital/fetch`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok && data) {
          setForm(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalProfile();
  }, []);

  /* FETCH VERIFICATION STATUS (NEW) */

  const refreshVerificationStatus = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/hospital/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (res.ok) {
      setVerificationStatus(data.verification_status);
    }
  } catch (err) {
    console.error("Error refreshing verification status", err);
  }
};

useEffect(()=>{
  refreshVerificationStatus();
},[])


  /* DERIVED FLAGS */
  const isLocked =
    verificationStatus === "pending" ||
    verificationStatus === "verified";

  const canShowDocuments =
    verificationStatus === "not_submitted" ||
    verificationStatus === "incomplete" ||
    verificationStatus === null;

  /* SUBMIT PROFILE (UNCHANGED) */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(`${API_BASE_URL}/hospital/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Update failed");
      return;
    }

    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading profile…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-10">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Hospital Profile
          </h2>

          {!editing && !isLocked && (
            <button
              onClick={() => setEditing(true)}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-5 py-2 rounded-lg font-medium transition"
            >
              Edit Profile
            </button>
          )}

          {isLocked && (
           verificationStatus === "verified" ? (
           <span className="text-sm text-gray-500">
             Verified
           </span>
           ) : (
           <span className="text-sm text-gray-500">
            Profile editing is locked during verification
           </span>
          )
          )}
        </div>

        {/* PROFILE FORM */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <Input
            label="Hospital Name"
            value={form.hospital_name}
            disabled={!editing}
            onChange={(v) => setForm({ ...form, hospital_name: v })}
          />

          <Input
            label="Hospital Type"
            value={form.hospital_type}
            disabled={!editing}
            onChange={(v) => setForm({ ...form, hospital_type: v })}
          />

          <Input
            label="Registration Number"
            value={form.registration_number_hospital}
            disabled={!editing}
            onChange={(v) =>
              setForm({ ...form, registration_number_hospital: v })
            }
          />

          <Input
            label="City"
            value={form.hospital_city}
            disabled={!editing}
            onChange={(v) => setForm({ ...form, hospital_city: v })}
          />

          <Input
            label="State"
            value={form.hospital_state}
            disabled={!editing}
            onChange={(v) => setForm({ ...form, hospital_state: v })}
          />

          <Input
            label="Contact Person Name"
            value={form.hospital_person_name}
            disabled={!editing}
            onChange={(v) =>
              setForm({ ...form, hospital_person_name: v })
            }
          />

          <Input
            label="Contact Person Email"
            value={form.hospital_person_email}
            disabled={!editing}
            onChange={(v) =>
              setForm({ ...form, hospital_person_email: v })
            }
          />

          <Input
            label="Website"
            value={form.hospital_website}
            disabled={!editing}
            onChange={(v) =>
              setForm({ ...form, hospital_website: v })
            }
          />

          {editing && !isLocked && (
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Save Changes
              </button>
            </div>
          )}
        </form>

        {/* VERIFICATION SECTION */}
        <div className="mt-12 border-t pt-8">

          {verificationStatus === "pending" && (
            <div className="bg-[var(--color-accent)] border border-red-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-[var(--color-primary-dark)]">
                Thank you for reaching out
              </h3>
              <p className="text-sm text-[var(--color-primary)] mt-2">
                We have received your documents and will reach out to you soon.
              </p>
            </div>
          )}

          {verificationStatus === "verified" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-green-700">
                ✅ Hospital Verified
              </h3>
              <p className="text-sm text-green-600 mt-2">
                Your hospital has been successfully verified.
              </p>
            </div>
          )}

          {canShowDocuments && (
            <>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Verification Documents
              </h3>
              <p className="text-gray-500 mb-6">
                Upload required documents to verify your hospital.
              </p>

              <HospitalDocUpload onVerificationSent={refreshVerificationStatus}/>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* INPUT COMPONENT */
function Input({ label, value, onChange, disabled }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>
      <input
        className={`w-full px-4 py-2 border rounded-lg transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
          disabled
            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
            : "bg-white"
        }`}
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
