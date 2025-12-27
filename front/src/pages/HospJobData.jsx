import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";
import logo1 from "../assets/1.png";

export default function HospJobData() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user.role;
  const isAdmin = userRole === "admin";

  const [job, setJob] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);

  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(true);
  const [canViewApplicants, setCanViewApplicants] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);

  /* ================= FETCH JOB ================= */
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch job");

        setJob(data.job);
        setForm(data.job);

        // Check if user can edit/view applicants
        // Admin can always view and edit
        if (isAdmin) {
          setCanEdit(true);
          setCanViewApplicants(true);
        } else if (userRole === "hospital") {
          // For hospitals, backend will verify ownership
          // We'll set these based on successful API calls
          setCanViewApplicants(true); // Will be verified by backend
          setCanEdit(true); // Will be verified by backend
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, token, userRole, isAdmin]);

  /* ================= FETCH APPLICANTS ================= */
  useEffect(() => {
    // Only fetch applicants if user is hospital or admin
    if (userRole !== "hospital" && !isAdmin) {
      setLoadingApplicants(false);
      setCanViewApplicants(false);
      return;
    }

    const fetchApplicants = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/jobs/${jobId}/applicants`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();
        if (!res.ok) {
          // If unauthorized (403), user can't view applicants
          if (res.status === 403) {
            setCanViewApplicants(false);
            setCanEdit(false);
            setLoadingApplicants(false);
            return;
          }
          throw new Error(data.message);
        }

        setApplicants(data.applicants || []);
        setCanViewApplicants(true);
      } catch (err) {
        console.error("Applicants fetch error:", err.message);
        // If error is not 403, still allow viewing (might be network error)
        if (err.message.includes("Unauthorized") || err.message.includes("403")) {
          setCanViewApplicants(false);
          setCanEdit(false);
        }
      } finally {
        setLoadingApplicants(false);
      }
    };

    fetchApplicants();
  }, [jobId, token, userRole, isAdmin]);

  /* ================= UPDATE JOB ================= */
  const handleUpdate = async (e) => {
    e.preventDefault();

    // Backend will verify if user can edit
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          min_salary: Number(form.min_salary),
          max_salary: Number(form.max_salary),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // If unauthorized, disable edit
        if (res.status === 403) {
          setCanEdit(false);
        }
        throw new Error(data.message);
      }

      setJob(data.job);
      setEditing(false);
    } catch (err) {
      alert(err.message);
    }
  };

  /* ================= APPROVE APPLICATION ================= */
  const handleApprove = async (applicationId, interviewDate) => {
    if (!interviewDate) {
      alert("Please select an interview date");
      return;
    }

    setProcessingAction(applicationId);
    try {
      const res = await fetch(`${API_BASE_URL}/applications/application/approve/${applicationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ interview_date: interviewDate }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to approve application");
      }

      // Refresh applicants list
      const applicantsRes = await fetch(`${API_BASE_URL}/jobs/${jobId}/applicants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const applicantsData = await applicantsRes.json();
      if (applicantsRes.ok) {
        setApplicants(applicantsData.applicants || []);
      }

      alert(`Application approved! Interview date: ${data.interview_date}`);
      setShowDateModal(false);
      setSelectedApplicationId(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingAction(null);
    }
  };

  /* ================= REJECT APPLICATION ================= */
  const handleReject = async (applicationId) => {
    if (!window.confirm("Are you sure you want to reject this application?")) {
      return;
    }

    setProcessingAction(applicationId);
    try {
      const res = await fetch(`${API_BASE_URL}/applications/application/reject/${applicationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reject application");
      }

      // Refresh applicants list
      const applicantsRes = await fetch(`${API_BASE_URL}/jobs/${jobId}/applicants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const applicantsData = await applicantsRes.json();
      if (applicantsRes.ok) {
        setApplicants(applicantsData.applicants || []);
      }

      alert("Application rejected");
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingAction(null);
    }
  };

  /* ================= DELETE JOB ================= */
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${job.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete job");
      }

      alert("Job deleted successfully");
      navigate("/posted-jobs");
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  /* ================= UI STATES ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading job details…
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

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Job not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-10 px-3 sm:px-4">
      {/* Logo Section */}
      <div className="max-w-4xl mx-auto mb-4 sm:mb-6 text-center">
        <img 
          src={logo1} 
          alt="DocSpace Logo" 
          className="h-12 sm:h-20 md:h-28 w-auto object-contain mx-auto"
        />
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-10">

        {/* ================= HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 break-words">
            {editing ? "Edit Job" : job.title}
          </h2>

          {!editing && canEdit && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <button
                onClick={() => setEditing(true)}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-4 sm:px-5 py-2 rounded-lg font-medium transition text-sm sm:text-base"
              >
                Edit Job
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-5 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {deleting ? "Deleting..." : "Delete Job"}
              </button>
            </div>
          )}
        </div>

        {/* ================= VIEW MODE ================= */}
        {!editing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-sm">
            <DetailItem label="Department" value={job.department} />
            <DetailItem label="Job Type" value={job.job_type} />
            <DetailItem label="Experience Required" value={job.experience_required} />
            <DetailItem
              label="Salary Range"
              value={
                job.min_salary && job.max_salary
                  ? `₹${job.min_salary.toLocaleString()} – ₹${job.max_salary.toLocaleString()}`
                  : "—"
              }
            />

            <div className="md:col-span-2">
              <p className="text-gray-500 mb-2 text-xs sm:text-sm">Job Description</p>
              <p className="text-gray-800 whitespace-pre-line text-sm sm:text-base leading-relaxed">
                {job.description || "—"}
              </p>
            </div>
          </div>
        )}

        {/* ================= EDIT MODE ================= */}
        {editing && (
          <form
            onSubmit={handleUpdate}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
          >
            <Input label="Job Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <Input label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
            <Input label="Job Type" value={form.job_type} onChange={(v) => setForm({ ...form, job_type: v })} />
            <Input label="Experience Required" value={form.experience_required} onChange={(v) => setForm({ ...form, experience_required: v })} />
            <Input label="Minimum Salary" type="number" value={form.min_salary} onChange={(v) => setForm({ ...form, min_salary: v })} />
            <Input label="Maximum Salary" type="number" value={form.max_salary} onChange={(v) => setForm({ ...form, max_salary: v })} />

            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                Job Description
              </label>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setForm(job);
                }}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg border text-gray-600 text-sm sm:text-base font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base font-semibold transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* ================= APPLICANTS ================= */}
        {(userRole === "hospital" || isAdmin) && canViewApplicants && (
          <div className="mt-8 sm:mt-12">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
              Applicants {isAdmin && <span className="text-xs sm:text-sm font-normal text-gray-500">(Admin View)</span>}
            </h3>

            {loadingApplicants ? (
              <p className="text-gray-500 text-sm sm:text-base">Loading applicants…</p>
            ) : applicants.length === 0 ? (
              <p className="text-gray-500 text-sm sm:text-base">No applications yet</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {applicants.map((a) => {
                  const status = a.verification_status || a.users?.verification_status || "pending";
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
                  const isProcessing = processingAction === a.id;

                  return (
                    <div
                      key={a.id}
                      className="p-3 sm:p-4 border rounded-lg sm:rounded-xl hover:bg-gray-50 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div
                          onClick={() => navigate(`/profile/${a.users.id}`)}
                          className="flex-1 cursor-pointer min-w-0"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                              {a.users?.name || "Unknown"}
                            </p>
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded-full border w-fit ${statusColors[status] || statusColors.pending}`}
                            >
                              {statusLabels[status] || "Pending"}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 break-words">
                            {a.users?.designation || "—"}
                            {a.users?.specialization ? ` • ${a.users.specialization}` : ""}
                          </p>
                          {a.interview_date && status === "approved" && (
                            <p className="text-xs text-green-600 mt-1 font-medium">
                              Interview: {new Date(a.interview_date).toLocaleDateString()}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            Applied on{" "}
                            {a.applied_at
                              ? new Date(a.applied_at).toLocaleDateString()
                              : "—"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:ml-4">
                          {/* View Resume button - always visible for all applicants */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/resume/${a.users.id}`);
                            }}
                            className="flex-1 sm:flex-none px-3 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs sm:text-sm rounded-lg transition flex items-center justify-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">description</span>
                            <span className="hidden sm:inline">View Resume</span>
                            <span className="sm:hidden">Resume</span>
                          </button>
                          {/* Approve button - only for non-approved applicants */}
                          {status !== "approved" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedApplicationId(a.id);
                                setShowDateModal(true);
                              }}
                              disabled={isProcessing || status === "rejected"}
                              className="flex-1 sm:flex-none px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              <span className="hidden sm:inline">Approve</span>
                              <span className="sm:hidden">Approve</span>
                            </button>
                          )}
                          {/* Reject button - only for non-rejected applicants */}
                          {status !== "rejected" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(a.id);
                              }}
                              disabled={isProcessing || status === "approved"}
                              className="flex-1 sm:flex-none px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-sm">cancel</span>
                              <span className="hidden sm:inline">Reject</span>
                              <span className="sm:hidden">Reject</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Date Input Modal for Approve */}
      {showDateModal && (
        <DateInputModal
          isOpen={showDateModal}
          onClose={() => {
            setShowDateModal(false);
            setSelectedApplicationId(null);
          }}
          onConfirm={(date) => {
            if (selectedApplicationId) {
              handleApprove(selectedApplicationId, date);
            }
          }}
          applicantName={applicants.find(a => a.id === selectedApplicationId)?.users?.name || "Applicant"}
        />
      )}
    </div>
  );
}

/* ================= DATE INPUT MODAL ================= */
function DateInputModal({ isOpen, onClose, onConfirm, applicantName }) {
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split("T")[0];
      setDate(today);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!date) {
      alert("Please select an interview date");
      return;
    }

    setLoading(true);
    try {
      await onConfirm(date);
      setDate("");
    } catch (err) {
      alert(err.message || "Failed to approve application");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 md:p-8 max-w-md w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
          Approve Application
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          Select the interview date for <span className="font-semibold">{applicantName}</span>
        </p>

        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Interview Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-[var(--color-primary)] focus:outline-none transition"
            required
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50 text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !date}
            className="flex-1 px-4 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? "Approving..." : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= HELPERS ================= */

function DetailItem({ label, value }) {
  return (
    <div className="p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
      <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">{label}</p>
      <p className="text-sm sm:text-base font-medium text-gray-800 break-words">{value || "—"}</p>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition"
      />
    </div>
  );
}