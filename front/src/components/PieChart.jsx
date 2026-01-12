export default function PieChart({ data, colors, size = 200 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        No data available
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        No data available
      </div>
    );
  }

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 10;

  let currentAngle = -90; // Start from top
  const paths = [];

  data.forEach((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    // Handle 100% case (full circle)
    let pathData;
    if (Math.abs(angle - 360) < 0.01 || data.length === 1) {
      // Full circle - draw a complete circle using two arcs
      const x1 = centerX;
      const y1 = centerY - radius;
      pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 1 1 ${centerX} ${centerY + radius}`,
        `A ${radius} ${radius} 0 1 1 ${x1} ${y1}`,
        "Z",
      ].join(" ");
    } else {
      // Partial circle
      const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
      const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
      const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
      const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

      const largeArcFlag = angle > 180 ? 1 : 0;

      pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        "Z",
      ].join(" ");
    }

    paths.push({
      pathData,
      color: colors[index % colors.length],
      label: item.label,
      value: item.value,
      percentage: (percentage * 100).toFixed(1),
    });

    currentAngle = endAngle;
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="mb-4">
        {paths.map((path, index) => (
          <path
            key={index}
            d={path.pathData}
            fill={path.color}
            stroke="white"
            strokeWidth="2"
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
        ))}
      </svg>
      <div className="w-full space-y-2">
        {paths.map((path, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: path.color }}
            />
            <span className="text-gray-600">{path.label}:</span>
            <span className="font-semibold text-gray-800">{path.value}</span>
            <span className="text-gray-400">({path.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

