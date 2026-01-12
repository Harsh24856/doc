export default function BarChart({ data, colors, height = 200 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-2 h-48 mb-4">
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          const color = colors[index % colors.length];

          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center justify-end h-full">
                <div
                  className="w-full rounded-t transition-all hover:opacity-80 cursor-pointer"
                  style={{
                    height: `${barHeight}%`,
                    backgroundColor: color,
                    minHeight: item.value > 0 ? "4px" : "0",
                  }}
                  title={`${item.label}: ${item.value}`}
                />
              </div>
              <div className="mt-2 text-xs text-gray-600 text-center">
                {item.label}
              </div>
              <div className="text-xs font-semibold text-gray-800 mt-1">
                {item.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

