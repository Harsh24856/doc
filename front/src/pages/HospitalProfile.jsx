import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api.js";
import HospitalDocUpload from "../components/HospitalDocUpload.jsx";
import logo1 from "../assets/1.png";
import StatusBadge from "../components/StatusBadge";
import Footer from "../components/Footer";

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

  /* VERIFICATION STATUS */
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [rejectionMessage, setRejectionMessage] = useState(null);

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

    if (!res.ok) return;

    setVerificationStatus(data.verification_status);

    if (data.verification_status === "rejected") {
      const msgRes = await fetch(`${API_BASE_URL}/hospital/message`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const msgData = await msgRes.json();

      if (msgRes.ok) {
        setRejectionMessage(msgData.rejection_reason);
      }
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
    verificationStatus === "rejected" ||
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
           <p className="text-gray-500 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-grow py-8 px-4 sm:px-6">
        {/* REJECTION MESSAGE */}
        {verificationStatus === "rejected" && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm flex items-start gap-4">
               <span className="material-symbols-outlined text-red-600 text-2xl mt-0.5">gpp_bad</span>
               <div>
                  <h3 className="text-lg font-bold text-red-800 mb-2">
                    Profile Rejected
                  </h3>
                  <p className="text-red-700 mb-4">
                    Please review the details below, make the required changes, and resubmit your documents.
                  </p>
                  {rejectionMessage && (
                   <div className="bg-white/50 border border-red-100 rounded-lg p-3">
                     <p className="text-sm font-semibold text-red-800 mb-1">Reason:</p>
                     <p className="text-sm text-red-700">{rejectionMessage}</p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* HEADER */}
          <div className="px-6 py-6 sm:px-10 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h1 className="text-2xl font-bold text-gray-900 mb-1">Hospital Profile</h1>
               <p className="text-gray-500 text-sm">Manage your institution's details and verification.</p>
            </div>

            <div className="flex items-center gap-3">
               <StatusBadge status={verificationStatus} />
               {!editing && !isLocked && (
                  <button
                    onClick={() => setEditing(true)}
                    className="btn-secondary text-sm"
                  >
                    Edit Profile
                  </button>
               )}
            </div>
          </div>

          <div className="p-6 sm:p-10">
            {isLocked && verificationStatus !== "verified" && (
                <div className="mb-8 p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 flex items-center gap-3">
                   <span className="material-symbols-outlined">lock</span>
                   <span className="text-sm font-medium">Profile editing is locked while verification is in progress.</span>
                </div>
            )}

            {/* PROFILE FORM */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <Input
                label="Hospital Name"
                value={form.hospital_name}
                disabled={!editing}
                onChange={(v) => setForm({ ...form, hospital_name: v })}
                icon="local_hospital"
              />

              <Input
                label="Hospital Type"
                value={form.hospital_type}
                disabled={!editing}
                onChange={(v) => setForm({ ...form, hospital_type: v })}
                icon="category"
              />

              <Input
                label="Registration Number"
                value={form.registration_number_hospital}
                disabled={!editing}
                onChange={(v) =>
                  setForm({ ...form, registration_number_hospital: v })
                }
                icon="badge"
              />

              <div className="grid grid-cols-2 gap-4">
                 <Input
                   label="City"
                   value={form.hospital_city}
                   disabled={!editing}
                   onChange={(v) => setForm({ ...form, hospital_city: v })}
                   icon="location_city"
                 />

                 <Input
                   label="State"
                   value={form.hospital_state}
                   disabled={!editing}
                   onChange={(v) => setForm({ ...form, hospital_state: v })}
                   icon="map"
                 />
              </div>

              <div className="md:col-span-2 pt-4 border-t border-gray-100 mt-2">
                 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-6">Contact Information</h3>
                 <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                    <Input
                      label="Contact Person Name"
                      value={form.hospital_person_name}
                      disabled={!editing}
                      onChange={(v) =>
                        setForm({ ...form, hospital_person_name: v })
                      }
                      icon="person"
                    />

                    <Input
                      label="Contact Person Email"
                      value={form.hospital_person_email}
                      disabled={!editing}
                      onChange={(v) =>
                        setForm({ ...form, hospital_person_email: v })
                      }
                      icon="email"
                    />

                    <Input
                      label="Website"
                      value={form.hospital_website}
                      disabled={!editing}
                      onChange={(v) =>
                        setForm({ ...form, hospital_website: v })
                      }
                      icon="language"
                    />
                 </div>
              </div>

              {editing && !isLocked && (
                <div className="md:col-span-2 flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </form>

            {/* VERIFICATION SECTION */}
            <div className="mt-12 pt-10 border-t border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                 <span className="material-symbols-outlined text-gray-400">verified</span>
                 Verification Status
              </h2>

              {verificationStatus === "pending" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
                  <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <span className="material-symbols-outlined text-3xl">hourglass_top</span>
                  </div>
                  <h3 className="text-lg font-bold text-yellow-800 mb-2">Verification In Progress</h3>
                  <p className="text-yellow-700">
                    We have received your documents and our team is reviewing them. We will notify you once the process is complete.
                  </p>
                </div>
              )}

              {verificationStatus === "verified" && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <span className="material-symbols-outlined text-3xl">check_circle</span>
                  </div>
                  <h3 className="text-lg font-bold text-green-800 mb-2">Hospital Verified</h3>
                  <p className="text-green-700">
                    Your hospital has been successfully verified. You now have full access to all features.
                  </p>
                </div>
              )}

              {canShowDocuments && (
                <div className="bg-gray-50 rounded-xl p-6 sm:p-8 border border-gray-200">
                  <div className="mb-6">
                     <h3 className="text-lg font-bold text-gray-900 mb-1">Required Documents</h3>
                     <p className="text-gray-500 text-sm">Upload official documents to verify your hospital's identity.</p>
                  </div>
                  <HospitalDocUpload onVerificationSent={refreshVerificationStatus}/>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

/* INPUT COMPONENT */
function Input({ label, value, onChange, disabled, icon }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-all ${
            disabled
              ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
          }`}
          value={value || ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
        {icon && (
           <span className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-gray-400">
              {icon}
           </span>
        )}
      </div>
    </div>
  );
}
