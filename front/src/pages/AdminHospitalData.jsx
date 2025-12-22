import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API_BASE_URL from "../config/api.js";

export default function AdminHospitalData() {
  const { hospitalId } = useParams();
  const token = localStorage.getItem("token");

  const [hospital, setHospital] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHospitalData = async () => {
      try {
        /* Fetch hospital profile */
        const profileRes = await fetch(
          `${API_BASE_URL}/admin/hospitals/${hospitalId}/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const profileData = await profileRes.json();
        if (!profileRes.ok) {
          throw new Error(profileData.message || "Failed to fetch hospital profile");
        }

        setHospital(profileData.hospital);

        /* Fetch hospital documents */
        const docsRes = await fetch(
          `${API_BASE_URL}/admin/hospitals/${hospitalId}/documents`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const docsData = await docsRes.json();
        if (!docsRes.ok) {
          throw new Error(docsData.message || "Failed to fetch documents");
        }

        setDocuments(docsData.documents || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalData();
  }, [hospitalId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading hospital data…
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

  if (!hospital) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Hospital not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/*  Hospital Profile */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {hospital.hospital_name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <ProfileItem label="Hospital Type" value={hospital.hospital_type} />
            <ProfileItem
              label="Registration Number"
              value={hospital.registration_number_hospital}
            />
            <ProfileItem label="City" value={hospital.hospital_city} />
            <ProfileItem label="State" value={hospital.hospital_state} />
            <ProfileItem
              label="Contact Person"
              value={hospital.hospital_person_name}
            />
            <ProfileItem
              label="Contact Email"
              value={hospital.hospital_person_email}
            />
            <ProfileItem label="Website" value={hospital.hospital_website} />
            <ProfileItem
              label="Verification Status"
              value={hospital.verification_status}
            />
          </div>
        </div>

        {/*  Documents Section */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Submitted Documents
          </h3>

          {documents.length === 0 ? (
            <p className="text-gray-500">No documents uploaded</p>
          ) : (
            <ul className="space-y-3">
              {documents.map((doc) => (
                <li
                  key={doc.document_type}
                  className="flex items-center justify-between border rounded-lg px-4 py-3"
                >
                  <span className="capitalize text-sm font-medium text-gray-700">
                    {doc.document_type}
                  </span>

                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm font-medium hover:underline"
                  >
                    View PDF
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}

/* Helper component */
function ProfileItem({ label, value }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">
        {value || "—"}
      </p>
    </div>
  );
}
