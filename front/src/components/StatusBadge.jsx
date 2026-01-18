import React from "react";

export default function StatusBadge({ status, size = "md", showIcon = true }) {
  const normalizedStatus = status?.toLowerCase() || "unknown";

  const styles = {
    verified: "bg-green-100 text-green-700 border border-green-200",
    approved: "bg-green-100 text-green-700 border border-green-200",
    success: "bg-green-100 text-green-700 border border-green-200",

    pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    partially_verified: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    incomplete: "bg-yellow-50 text-yellow-700 border border-yellow-200",

    rejected: "bg-red-50 text-red-700 border border-red-200",
    failed: "bg-red-50 text-red-700 border border-red-200",
    error: "bg-red-50 text-red-700 border border-red-200",

    not_submitted: "bg-gray-100 text-gray-600 border border-gray-200",
    unknown: "bg-gray-100 text-gray-600 border border-gray-200",
  };

  const icons = {
    verified: "check_circle",
    approved: "check_circle",
    success: "check_circle",

    pending: "hourglass_empty",
    partially_verified: "timelapse",
    incomplete: "pending",

    rejected: "cancel",
    failed: "error",
    error: "error",

    not_submitted: "radio_button_unchecked",
    unknown: "help",
  };

  const labels = {
    verified: "Verified",
    approved: "Approved",
    success: "Success",

    pending: "Pending",
    partially_verified: "Partially Verified",
    incomplete: "Incomplete",

    rejected: "Rejected",
    failed: "Failed",
    error: "Error",

    not_submitted: "Not Submitted",
    unknown: "Unknown",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs sm:text-sm",
    lg: "px-3 py-1.5 text-sm sm:text-base",
  };

  const styleClass = styles[normalizedStatus] || styles.unknown;
  const iconName = icons[normalizedStatus] || icons.unknown;
  const labelText = labels[normalizedStatus] || normalizedStatus.replace(/_/g, " ");

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${styleClass} ${sizeClasses[size]}`}>
      {showIcon && <span className="material-symbols-outlined" style={{ fontSize: '1.2em' }}>{iconName}</span>}
      <span className="capitalize">{labelText}</span>
    </span>
  );
}
