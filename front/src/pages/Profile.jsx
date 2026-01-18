import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";
import StatusBadge from "../components/StatusBadge";
import Footer from "../components/Footer";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/profile/public/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Profile not found");
        }
        return data;
      })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Profile fetch error:", err.message);
        setError(err.message || "Profile not available");
        setLoading(false);
      });
  }, [id]);

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

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <div className="text-center p-8">
            <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">person_off</span>
            <p className="text-red-500 font-medium">{error}</p>
            <button
               onClick={() => navigate(-1)}
               className="mt-4 btn-secondary"
            >
               Go Back
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-grow py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
           {/* BACK BUTTON */}
           <button
             onClick={() => navigate(-1)}
             className="mb-6 flex items-center gap-2 text-gray-600 hover:text-[var(--color-primary)] transition-colors text-sm font-medium"
           >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Search
           </button>

           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* HEADER BANNER (Optional: could be a solid color or gradient) */}
              <div className="h-32 bg-gradient-to-r from-gray-100 to-gray-200"></div>

              <div className="px-6 sm:px-10 pb-10">
                 {/* PROFILE HEADER INFO */}
                 <div className="relative flex flex-col sm:flex-row items-end -mt-12 mb-8 gap-6">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white text-4xl font-bold shadow-lg shrink-0">
                       {data.name?.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 pb-2">
                       <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1">
                          <h1 className="text-3xl font-bold text-gray-900">{data.name}</h1>
                          <StatusBadge status={data.verification_status} />
                       </div>
                       <p className="text-lg text-gray-600 font-medium">
                          {data.specialization || "Medical Professional"}
                          {data.designation && <span className="text-gray-400 mx-2">|</span>}
                          {data.designation}
                       </p>
                       {data.hospital_affiliation && (
                          <div className="flex items-center gap-2 text-gray-500 mt-2 text-sm">
                             <span className="material-symbols-outlined text-[18px]">local_hospital</span>
                             <span>{data.hospital_affiliation}</span>
                          </div>
                       )}
                    </div>

                    <div className="flex gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                       <button
                         onClick={() => navigate(`/resume/${id}`)}
                         className="flex-1 sm:flex-none btn-secondary flex items-center justify-center gap-2"
                       >
                          <span className="material-symbols-outlined text-[20px]">description</span>
                          Resume
                       </button>
                       <button
                         onClick={() => navigate(`/messages`)} // Assuming chat navigates to generic messages, or specific if implemented
                         className="flex-1 sm:flex-none btn-primary flex items-center justify-center gap-2"
                       >
                          <span className="material-symbols-outlined text-[20px]">chat</span>
                          Message
                       </button>
                    </div>
                 </div>

                 {/* CONTENT GRID */}
                 <div className="grid md:grid-cols-3 gap-8">
                    {/* LEFT COLUMN (Details) */}
                    <div className="md:col-span-2 space-y-8">
                       <Section title="About">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                             {data.bio || "No biography provided."}
                          </p>
                       </Section>

                       <Section title="Experience & Qualifications">
                          <div className="space-y-4">
                             <DetailRow
                                icon="school"
                                label="Qualifications"
                                value={Array.isArray(data.qualifications) ? data.qualifications.join(", ") : data.qualifications}
                             />
                             <DetailRow
                                icon="history"
                                label="Experience"
                                value={data.years_of_experience ? `${data.years_of_experience} Years` : null}
                             />
                             <DetailRow
                                icon="workspace_premium"
                                label="Skills"
                                value={
                                   Array.isArray(data.skills) && data.skills.length > 0 ? (
                                      <div className="flex flex-wrap gap-2 mt-1">
                                         {data.skills.map((skill, i) => (
                                            <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                               {skill}
                                            </span>
                                         ))}
                                      </div>
                                   ) : null
                                }
                             />
                          </div>
                       </Section>
                    </div>

                    {/* RIGHT COLUMN (Meta) */}
                    <div className="space-y-6">
                       <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                          <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Professional Details</h3>
                          <div className="space-y-4">
                             <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-gray-400 mt-0.5">badge</span>
                                <div>
                                   <p className="text-xs text-gray-500 font-medium uppercase">Role</p>
                                   <p className="text-gray-900 capitalize">{data.role}</p>
                                </div>
                             </div>
                             {data.registration_number && (
                                <div className="flex items-start gap-3">
                                   <span className="material-symbols-outlined text-gray-400 mt-0.5">pin</span>
                                   <div>
                                      <p className="text-xs text-gray-500 font-medium uppercase">Reg. Number</p>
                                      <p className="text-gray-900">{data.registration_number}</p>
                                   </div>
                                </div>
                             )}
                             {data.registration_council && (
                                <div className="flex items-start gap-3">
                                   <span className="material-symbols-outlined text-gray-400 mt-0.5">account_balance</span>
                                   <div>
                                      <p className="text-xs text-gray-500 font-medium uppercase">Council</p>
                                      <p className="text-gray-900">{data.registration_council}</p>
                                   </div>
                                </div>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

/* ================= UI HELPERS ================= */

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function DetailRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-4">
       <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-500">
          <span className="material-symbols-outlined">{icon}</span>
       </div>
       <div className="flex-1 pt-1">
          <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
          <div className="text-gray-600">{value}</div>
       </div>
    </div>
  );
}
