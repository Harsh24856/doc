import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api";

/* =========================
   DASHBOARD
   ========================= */

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const { profile, role, postedJobs = [], appliedJobs = [] } = data;

  /* =========================
     UI
     ========================= */

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* PROFILE CARD */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            👤 Your Profile
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <ProfileRow label="Name" value={profile.name} />
            <ProfileRow label="Role" value={profile.role} />
            <ProfileRow label="Email" value={profile.email} />
            <ProfileRow label="Phone" value={profile.phone} />
            <ProfileRow label="Designation" value={profile.designation} />
            <ProfileRow label="Specialization" value={profile.specialization} />
            <ProfileRow label="Hospital" value={profile.hospital_affiliation} />
            <ProfileRow label="Experience" value={profile.years_of_experience ? `${profile.years_of_experience} years` : "-"} />
          </div>

          <div className="mt-4">
            <p className="text-gray-500 text-sm mb-1">Bio</p>
            <p className="bg-gray-50 p-4 rounded-lg">
              {profile.bio || "-"}
            </p>
          </div>
        </div>

        {/* HOSPITAL DASHBOARD */}
        {role === "hospital" && (
          <Section title="🏥 Jobs You Posted">
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
          <Section title="📌 Jobs You Applied To">
            {appliedJobs.length === 0 ? (
              <Empty text="You have not applied to any jobs yet." />
            ) : (
              appliedJobs.map((app) => (
                <JobCard
                  key={app.id}
                  title={app.jobs?.title || "—"}
                  subtitle={`${app.jobs?.department || ""} ${app.jobs?.job_type || ""}`}
                  date={app.applied_at || null}
                  link={`/jobs/${app.jobs?.id}`}
                />
              ))
            )}
          </Section>
        )}

      </div>
    </div>
  );
}

/* =========================
   COMPONENTS
   ========================= */

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function JobCard({ title, subtitle, date, link }) {
  return (
    <a
      href={link}
      className="block border rounded-lg p-4 mb-3 hover:bg-gray-50 transition"
    >
      <h4 className="font-semibold text-gray-800">{title}</h4>
      <p className="text-sm text-gray-500">{subtitle}</p>
      {date && (
        <p className="text-xs text-gray-400 mt-1">
          {new Date(date).toLocaleDateString()}
        </p>
      )}
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