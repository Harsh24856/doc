import React from "react";

export default function StatCard({ icon, label, value, trend, color, onClick }) {
  // If color is passed as a class string (old way), use it, otherwise use default white card
  const isCustomColor = color && color.includes("bg-");

  if (isCustomColor) {
     return (
        <div
          onClick={onClick}
          className={`${color} rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-all duration-200 cursor-default`}
        >
          <div className="mb-3 flex justify-center">{icon}</div>
          <div className="text-3xl font-bold mb-1">{value}</div>
          <div className="text-sm font-medium opacity-90">{label}</div>
        </div>
     )
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-gray-300' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
           {icon}
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
        <p className="text-sm text-gray-500 mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}
