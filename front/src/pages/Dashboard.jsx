import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";
import PieChart from "../components/PieChart";
import BarChart from "../components/BarChart";
import Histogram from "../components/Histogram";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import Footer from "../components/Footer";

/* =========================
   DASHBOARD
   ========================= */

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event('logout'));
    navigate("/auth");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_BASE_URL}/api/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load dashboard");
        return json;
      })
      .then(setData)
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  /* =========================
     STATES
     ========================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <div className="flex flex-col items-center gap-4">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
           <p className="text-gray-500 font-medium">Loading dashboard...</p>
         </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-sm border border-red-100">
           <div className="text-red-500 text-5xl mb-4">⚠️</div>
           <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
           <p className="text-gray-600 mb-6">{error}</p>
           <button
             onClick={() => window.location.reload()}
             className="btn-primary"
           >
             Try Again
           </button>
        </div>
      </div>
    );
  }

  if (!data || !data.profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Profile not available
      </div>
    );
  }

  const { profile, role, hospital, postedJobs = [], appliedJobs = [], totalApplications = 0, applicationDates = [] } = data;

  // Calculate statistics
  const stats = role === "hospital" 
    ? {
        totalJobsPosted: postedJobs.length,
        totalApplications: totalApplications,
        activeJobs: postedJobs.length,
      }
    : {
        totalApplied: appliedJobs.length,
        totalResponses: appliedJobs.filter(app => app.verification_status === "approved" || app.verification_status === "rejected").length,
        pendingApplications: appliedJobs.filter(app => !app.verification_status || app.verification_status === "pending").length,
      };

  // Prepare chart data (Keeping logic same, focusing on UI)
  const chartColors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F"];

  const jobTypeData = role === "hospital"
    ? (() => {
        const typeCount = {};
        postedJobs.forEach((job) => {
          const type = job.job_type || "other";
          typeCount[type] = (typeCount[type] || 0) + 1;
        });
        return Object.entries(typeCount).map(([label, value]) => ({
          label: label.charAt(0).toUpperCase() + label.slice(1).replace("-", " "),
          value,
        }));
      })()
    : (() => {
        const typeCount = {};
        appliedJobs.forEach((app) => {
          const type = app.jobs?.job_type || "other";
          typeCount[type] = (typeCount[type] || 0) + 1;
        });
        return Object.entries(typeCount).map(([label, value]) => ({
          label: label.charAt(0).toUpperCase() + label.slice(1).replace("-", " "),
          value,
        }));
      })();

  const departmentData = role === "hospital"
    ? (() => {
        const deptCount = {};
        postedJobs.forEach((job) => {
          const dept = job.department || "Other";
          deptCount[dept] = (deptCount[dept] || 0) + 1;
        });
        return Object.entries(deptCount).map(([label, value]) => ({ label, value }));
      })()
    : (() => {
        const deptCount = {};
        appliedJobs.forEach((app) => {
          const dept = app.jobs?.department || "Other";
          deptCount[dept] = (deptCount[dept] || 0) + 1;
        });
        return Object.entries(deptCount).map(([label, value]) => ({ label, value }));
      })();

  const applicationStatusData = (() => {
    const statusCount = { approved: 0, rejected: 0, pending: 0 };

    if (role === "hospital") {
       if (data.applicationStatuses) {
          data.applicationStatuses.forEach((status) => {
            if (status === "approved") statusCount.approved += 1;
            else if (status === "rejected") statusCount.rejected += 1;
            else statusCount.pending += 1;
          });
       }
    } else {
      appliedJobs.forEach((app) => {
        const status = app.verification_status || "pending";
        if (status === "approved") statusCount.approved += 1;
        else if (status === "rejected") statusCount.rejected += 1;
        else statusCount.pending += 1;
      });
    }

    const allValues = [
      { label: "Approved", value: statusCount.approved },
      { label: "Rejected", value: statusCount.rejected },
      { label: "Pending", value: statusCount.pending },
    ];
    
    return allValues.filter(item => item.value > 0);
  })();

  const monthlyData = (() => {
    const counts = {};
    const dates = role === "hospital" ? applicationDates : appliedJobs.map(app => app.created_at || app.applied_at);

    dates.filter(Boolean).forEach((dateStr) => {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth();
      if (!counts[year]) counts[year] = Array(12).fill(0);
      counts[year][month] += 1;
    });

    const chartData = [];
    Object.keys(counts).sort().forEach(year => {
      for (let month = 0; month < 12; month++) {
        const monthName = new Date(year, month).toLocaleDateString("en-US", { month: "long" });
        chartData.push({
          label: monthName,
          value: counts[year][month] || 0,
        });
      }
    });
    return chartData;
  })();

  /* =========================
     UI
     ========================= */

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* HEADER & PROFILE SUMMARY */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                   <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                      Welcome back, {profile.name || hospital?.hospital_name}
                   </h1>
                   <p className="text-gray-500">
                      Here's what's happening with your account today.
                   </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-red-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Logout
                </button>
             </div>

             <div className="mt-8 pt-8 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   {role === "hospital" && hospital ? (
                      <>
                        <ProfileItem label="Hospital Type" value={hospital.hospital_type} icon="local_hospital" />
                        <ProfileItem label="City" value={hospital.hospital_city} icon="location_on" />
                        <ProfileItem label="Contact" value={hospital.hospital_person_name} icon="person" />
                        <ProfileItem
                           label="Status"
                           value={<StatusBadge status={hospital.verification_status} size="sm" />}
                           icon="verified"
                        />
                      </>
                   ) : (
                      <>
                        <ProfileItem label="Role" value={profile.role} icon="badge" capitalize />
                        <ProfileItem label="Specialization" value={profile.specialization} icon="medical_services" />
                        <ProfileItem label="Experience" value={profile.years_of_experience ? `${profile.years_of_experience} Years` : "-"} icon="history" />
                        <ProfileItem label="Phone" value={profile.phone} icon="call" />
                      </>
                   )}
                </div>
             </div>
          </div>

          {/* STATISTICS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {role === "hospital" ? (
              <>
                <StatCard
                  icon={<span className="material-symbols-outlined text-3xl text-[var(--color-primary)]">work</span>}
                  label="Jobs Posted"
                  value={stats.totalJobsPosted}
                />
                <StatCard
                  icon={<span className="material-symbols-outlined text-3xl text-blue-500">description</span>}
                  label="Applications Received"
                  value={stats.totalApplications}
                />
                <StatCard
                  icon={<span className="material-symbols-outlined text-3xl text-green-500">check_circle</span>}
                  label="Active Listings"
                  value={stats.activeJobs}
                />
              </>
            ) : (
              <>
                <StatCard
                  icon={<span className="material-symbols-outlined text-3xl text-[var(--color-primary)]">send</span>}
                  label="Jobs Applied"
                  value={stats.totalApplied}
                />
                <StatCard
                  icon={<span className="material-symbols-outlined text-3xl text-blue-500">mail</span>}
                  label="Responses"
                  value={stats.totalResponses}
                />
                <StatCard
                  icon={<span className="material-symbols-outlined text-3xl text-yellow-500">schedule</span>}
                  label="Pending"
                  value={stats.pendingApplications}
                />
              </>
            )}
          </div>

          {/* CHARTS SECTION */}
          {(postedJobs.length > 0 || appliedJobs.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {applicationStatusData.length > 0 && (
                <ChartCard title="Application Status">
                   <div className="flex justify-center py-4">
                    <PieChart 
                      data={applicationStatusData} 
                      colors={["#10b981", "#ef4444", "#f59e0b"]} 
                      size={200} 
                    />
                  </div>
                </ChartCard>
              )}

              {jobTypeData.length > 0 && (
                <ChartCard title={role === "hospital" ? "Jobs by Type" : "Applications by Type"}>
                   <div className="flex justify-center py-4">
                    <PieChart data={jobTypeData} colors={chartColors} size={200} />
                  </div>
                </ChartCard>
              )}

              {departmentData.length > 0 && (
                <ChartCard title={role === "hospital" ? "Jobs by Department" : "Applications by Department"}>
                  <div className="flex justify-center py-4">
                    <PieChart data={departmentData} colors={chartColors} size={200} />
                  </div>
                </ChartCard>
              )}

              {monthlyData.length > 0 && (
                <div className="lg:col-span-2">
                   <ChartCard title="Activity Trends">
                      <div className="h-64 mt-4">
                         <Histogram data={monthlyData} colors={chartColors} height={250} />
                      </div>
                   </ChartCard>
                </div>
              )}
            </div>
          )}

          {/* ACTIVITY LIST */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                   <span className="material-symbols-outlined text-gray-500">list_alt</span>
                   {role === "hospital" ? "Recent Job Postings" : "Recent Applications"}
                </h3>
             </div>
             <div className="divide-y divide-gray-100">
                {role === "hospital" ? (
                   postedJobs.length === 0 ? (
                      <EmptyState message="You haven't posted any jobs yet." />
                   ) : (
                      postedJobs.map((job) => (
                        <div key={job.id} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                           <div>
                              <h4 className="font-semibold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">{job.title}</h4>
                              <p className="text-sm text-gray-500 mt-0.5">{job.department} • {job.job_type}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-xs text-gray-400 mb-1">{new Date(job.created_at).toLocaleDateString()}</p>
                              <a href={`/jobs/${job.id}`} className="text-sm font-medium text-[var(--color-primary)] hover:underline">View Details</a>
                           </div>
                        </div>
                      ))
                   )
                ) : (
                   appliedJobs.length === 0 ? (
                      <EmptyState message="You haven't applied to any jobs yet." />
                   ) : (
                      appliedJobs.map((app) => (
                        <div key={app.id} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                           <div>
                              <h4 className="font-semibold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">{app.jobs?.title || "Unknown Job"}</h4>
                              <p className="text-sm text-gray-500 mt-0.5">
                                 {app.jobs?.department}
                                 {app.jobs?.job_type && ` • ${app.jobs.job_type}`}
                              </p>
                              {app.interview_date && app.verification_status === "approved" && (
                                <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">event</span>
                                  Interview: {new Date(app.interview_date).toLocaleDateString()}
                                </p>
                              )}
                           </div>
                           <div className="flex items-center gap-4 self-start sm:self-center">
                              <StatusBadge status={app.verification_status || "pending"} />
                              <a href={`/jobs/view/${app.jobs?.id}`} className="p-2 text-gray-400 hover:text-[var(--color-primary)] transition-colors">
                                 <span className="material-symbols-outlined">arrow_forward</span>
                              </a>
                           </div>
                        </div>
                      ))
                   )
                )}
             </div>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}

/* =========================
   COMPONENTS
   ========================= */

function ProfileItem({ label, value, icon, capitalize }) {
  return (
    <div className="flex items-start gap-3">
       <div className="p-2 bg-gray-50 rounded-lg text-gray-400 shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
       </div>
       <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
          <div className={`text-sm font-medium text-gray-900 ${capitalize ? 'capitalize' : ''} break-words`}>
             {value || "—"}
          </div>
       </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
       <h3 className="font-bold text-gray-800 mb-6 text-center">{title}</h3>
       {children}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="p-8 text-center text-gray-500">
       <p>{message}</p>
    </div>
  );
}
