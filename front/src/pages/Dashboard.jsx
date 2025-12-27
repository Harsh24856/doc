import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";
import PieChart from "../components/PieChart";
import BarChart from "../components/BarChart";
import Histogram from "../components/Histogram";

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
    // Trigger a custom event to notify App.jsx to update state
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
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading dashboard…
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

  if (!data || !data.profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Profile not available
      </div>
    );
  }

  const { profile, role, hospital, postedJobs = [], appliedJobs = [], totalApplications = 0, applicationStatuses = [], applicationDates = [] } = data;

  // Calculate statistics
  const stats = role === "hospital" 
    ? {
        totalJobsPosted: postedJobs.length,
        totalApplications: totalApplications, // From backend
        activeJobs: postedJobs.length, // Can be enhanced with status
      }
    : {
        totalApplied: appliedJobs.length,
        totalResponses: appliedJobs.filter(app => app.verification_status === "approved" || app.verification_status === "rejected").length,
        pendingApplications: appliedJobs.filter(app => !app.verification_status || app.verification_status === "pending").length,
      };

  // Prepare chart data
  const chartColors = [
    "#FF6B6B", // Primary red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#FFA07A", // Light salmon
    "#98D8C8", // Mint
    "#F7DC6F", // Yellow
  ];

  // Job Type Distribution (Pie Chart)
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

  // Department Distribution (Pie Chart)
  const departmentData = role === "hospital"
    ? (() => {
        const deptCount = {};
        postedJobs.forEach((job) => {
          const dept = job.department || "Other";
          deptCount[dept] = (deptCount[dept] || 0) + 1;
        });
        return Object.entries(deptCount).map(([label, value]) => ({
          label,
          value,
        }));
      })()
    : (() => {
        const deptCount = {};
        appliedJobs.forEach((app) => {
          const dept = app.jobs?.department || "Other";
          deptCount[dept] = (deptCount[dept] || 0) + 1;
        });
        return Object.entries(deptCount).map(([label, value]) => ({
          label,
          value,
        }));
      })();

  // Application Status Distribution (Pie Chart) - For both users and hospitals
  const applicationStatusData = (() => {
    const statusCount = {
      approved: 0,
      rejected: 0,
      pending: 0,
    };

    if (role === "hospital") {
      // For hospitals, use applicationStatuses from backend
      applicationStatuses.forEach((status) => {
        if (status === "approved") {
          statusCount.approved += 1;
        } else if (status === "rejected") {
          statusCount.rejected += 1;
        } else {
          statusCount.pending += 1;
        }
      });
    } else {
      // For users, use appliedJobs
      appliedJobs.forEach((app) => {
        const status = app.verification_status || "pending";
        if (status === "approved") {
          statusCount.approved += 1;
        } else if (status === "rejected") {
          statusCount.rejected += 1;
        } else {
          statusCount.pending += 1;
        }
      });
    }

    // Filter out zero values
    const allValues = [
      { label: "Approved", value: statusCount.approved },
      { label: "Rejected", value: statusCount.rejected },
      { label: "Pending", value: statusCount.pending },
    ];
    
    const nonZeroValues = allValues.filter(item => item.value > 0);
    
    return nonZeroValues.length > 0 ? nonZeroValues : [];
  })();

  // Monthly Activity (Histogram) - Yearly data showing all 12 months of each year
  const monthlyData = (() => {
    const counts = {};
    const dates = role === "hospital" ? applicationDates : appliedJobs.map(app => app.created_at || app.applied_at);

    dates.filter(Boolean).forEach((dateStr) => {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11
      const monthName = date.toLocaleDateString("en-US", { month: "long" });

      if (!counts[year]) {
        counts[year] = Array(12).fill(0); // Initialize all 12 months for the year
      }
      counts[year][month] += 1;
    });

    const chartData = [];
    const sortedYears = Object.keys(counts).sort();

    sortedYears.forEach(year => {
      for (let month = 0; month < 12; month++) {
        const monthName = new Date(year, month).toLocaleDateString("en-US", { month: "long" });
        chartData.push({
          label: monthName,
          value: counts[year][month] || 0,
          sortKey: `${year}-${String(month + 1).padStart(2, "0")}`
        });
      }
    });
    return chartData;
  })();

  /* =========================
     UI
     ========================= */

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 md:py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">

        {/* PROFILE CARD */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
            {role === "hospital" ? (
              <>
                <span className="material-symbols-outlined text-2xl text-gray-700">local_hospital</span>
                Hospital Profile
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-2xl text-gray-700">person</span>
                Your Profile
              </>
            )}
          </h2>

          {role === "hospital" && hospital ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <ProfileRow label="Hospital Name" value={hospital.hospital_name} />
              <ProfileRow label="Hospital Type" value={hospital.hospital_type} />
              <ProfileRow label="Registration Number" value={hospital.registration_number_hospital} />
              <ProfileRow label="City" value={hospital.hospital_city} />
              <ProfileRow label="State" value={hospital.hospital_state} />
              <ProfileRow label="Contact Person" value={hospital.hospital_person_name} />
              <ProfileRow label="Contact Email" value={hospital.hospital_person_email} />
              <ProfileRow label="Website" value={hospital.hospital_website} />
              <ProfileRow label="Verification Status" value={hospital.verification_status ? hospital.verification_status.charAt(0).toUpperCase() + hospital.verification_status.slice(1) : "-"} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <ProfileRow label="Name" value={profile.name} />
              <ProfileRow label="Role" value={profile.role} />
              <ProfileRow label="Email" value={profile.email} />
              <ProfileRow label="Phone" value={profile.phone} />
              <ProfileRow label="Designation" value={profile.designation} />
              <ProfileRow label="Specialization" value={profile.specialization} />
              <ProfileRow label="Hospital" value={profile.hospital_affiliation} />
              <ProfileRow label="Experience" value={profile.years_of_experience ? `${profile.years_of_experience} years` : "-"} />
            </div>
          )}

          {role !== "hospital" && (
            <div className="mt-3 sm:mt-4">
              <p className="text-gray-500 text-xs sm:text-sm mb-1">Bio</p>
              <p className="bg-gray-50 p-3 sm:p-4 rounded-lg text-xs sm:text-sm">
                {profile.bio || "-"}
              </p>
            </div>
          )}
        </div>

        {/* STATISTICS SECTION */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-xl sm:text-2xl text-gray-700">bar_chart</span>
            Statistics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {role === "hospital" ? (
              <>
                <StatCard
                  icon={<span className="material-symbols-outlined text-3xl">work</span>}
                  label="Jobs Posted"
                  value={stats.totalJobsPosted}
                  color="bg-[var(--color-accent)] text-[var(--color-primary-dark)]"
                />
                <StatCard
                  icon={<span className="material-symbols-outlined text-3xl">description</span>}
                  label="Total Applications"
                  value={stats.totalApplications}
                  color="bg-green-100 text-green-700"
                />
                <StatCard
                  icon={<span className="material-symbols-outlined text-3xl">check_circle</span>}
                  label="Active Jobs"
                  value={stats.activeJobs}
                  color="bg-blue-100 text-blue-700"
                />
              </>
            ) : (
              <>
                <StatCard
                  icon={<span className="material-symbols-outlined text-3xl">description</span>}
                  label="Jobs Applied"
                  value={stats.totalApplied}
                  color="bg-[var(--color-accent)] text-[var(--color-primary-dark)]"
                />
                <StatCard
                  icon={<span className="material-symbols-outlined text-3xl">mail</span>}
                  label="Responses Received"
                  value={stats.totalResponses}
                  color="bg-green-100 text-green-700"
                />
                <StatCard
                  icon={<span className="material-symbols-outlined text-3xl">schedule</span>}
                  label="Pending Applications"
                  value={stats.pendingApplications}
                  color="bg-yellow-100 text-yellow-700"
                />
              </>
            )}
          </div>

          {/* CHARTS SECTION */}
          {(postedJobs.length > 0 || appliedJobs.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mt-6 sm:mt-8">
              {/* Application Status Distribution - Pie Chart (All roles) */}
              {applicationStatusData.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 text-center">
                    {role === "hospital" ? "Application Status" : "Application Status"}
                  </h3>
                  <div className="flex justify-center">
                    <PieChart 
                      data={applicationStatusData} 
                      colors={["#10b981", "#ef4444", "#f59e0b"]} 
                      size={200} 
                    />
                  </div>
                </div>
              )}

              {/* Job Type Distribution - Pie Chart */}
              {jobTypeData.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 text-center">
                    {role === "hospital" ? "Jobs by Type" : "Applications by Type"}
                  </h3>
                  <div className="flex justify-center">
                    <PieChart data={jobTypeData} colors={chartColors} size={200} />
                  </div>
                </div>
              )}

              {/* Department Distribution - Pie Chart */}
              {departmentData.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 text-center">
                    {role === "hospital" ? "Jobs by Department" : "Applications by Department"}
                  </h3>
                  <div className="flex justify-center">
                    <PieChart data={departmentData} colors={chartColors} size={200} />
                  </div>
                </div>
              )}

              {/* Yearly Activity - Histogram */}
              {monthlyData.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6 lg:col-span-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 text-center">
                    {role === "hospital" ? "Yearly Application Trends" : "Yearly Application Trends"}
                  </h3>
                  <div className="overflow-x-auto">
                    <Histogram data={monthlyData} colors={chartColors} height={200} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* HOSPITAL DASHBOARD */}
        {role === "hospital" && (
          <Section title={
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined">local_hospital</span>
              Jobs You Posted
            </span>
          }>
            {postedJobs.length === 0 ? (
              <Empty text="You have not posted any jobs yet." />
            ) : (
              postedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  title={job.title}
                  subtitle={`${job.department} • ${job.job_type}`}
                  date={job.created_at}
                  link={`/jobs/${job.id}`}
                />
              ))
            )}
          </Section>
        )}

        {/* USER DASHBOARD */}
        {role !== "hospital" && (
          <Section title={
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined">bookmark</span>
              Jobs You Applied To
            </span>
          }>
            {appliedJobs.length === 0 ? (
              <Empty text="You have not applied to any jobs yet." />
            ) : (
              appliedJobs.map((app) => (
                <JobCard
                  key={app.id}
                  title={app.jobs?.title || "—"}
                  subtitle={`${app.jobs?.department || ""} ${app.jobs?.job_type ? ` • ${app.jobs.job_type}` : ""}`}
                  date={app.created_at || app.applied_at || null}
                  link={`/jobs/view/${app.jobs?.id}`}
                  status={app.verification_status || "pending"}
                  interviewDate={app.interview_date || null}
                />
              ))
            )}
          </Section>
        )}

        {/* LOGOUT BUTTON */}
        <div className="flex justify-center pt-6 sm:pt-8 pb-4">
          <button
            onClick={handleLogout}
            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm sm:text-base transition shadow-md hover:shadow-lg"
          >
            Logout
          </button>
        </div>

      </div>
    </div>
  );
}

/* =========================
   COMPONENTS
   ========================= */

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function JobCard({ title, subtitle, date, link, status, interviewDate }) {
  const statusColors = {
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };
  const statusLabels = {
    approved: (
      <span className="flex items-center gap-1">
        <span className="material-symbols-outlined text-xs">check_circle</span>
        Approved
      </span>
    ),
    rejected: (
      <span className="flex items-center gap-1">
        <span className="material-symbols-outlined text-xs">cancel</span>
        Rejected
      </span>
    ),
    pending: (
      <span className="flex items-center gap-1">
        <span className="material-symbols-outlined text-xs">schedule</span>
        Pending
      </span>
    ),
  };

  return (
    <a
      href={link}
      className="block border rounded-lg p-4 mb-3 hover:bg-gray-50 transition"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-800">{title}</h4>
            {status && (
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${statusColors[status] || statusColors.pending}`}
              >
                {statusLabels[status] || "Pending"}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{subtitle}</p>
          {date && (
            <p className="text-xs text-gray-400 mt-1">
              Applied on {new Date(date).toLocaleDateString()}
            </p>
          )}
          {interviewDate && status === "approved" && (
            <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">event</span>
              Interview: {new Date(interviewDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">
        {value || "-"}
      </p>
    </div>
  );
}

function Empty({ text }) {
  return (
    <p className="text-gray-500 text-sm">
      {text}
    </p>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`${color} rounded-xl p-4 sm:p-6 text-center`}>
      <div className="mb-2 sm:mb-3 flex justify-center">{icon}</div>
      <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{value}</div>
      <div className="text-xs sm:text-sm font-medium opacity-80">{label}</div>
    </div>
  );
}