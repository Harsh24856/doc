export default function Histogram({ data, colors, height = 200 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const barWidth = 100 / data.length; // Percentage width for each bar

  return (
    <div className="w-full">
      <div className="relative" style={{ height: `${height}px` }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500 pr-2">
          <span>{maxValue}</span>
          <span>{Math.floor(maxValue * 0.75)}</span>
          <span>{Math.floor(maxValue * 0.5)}</span>
          <span>{Math.floor(maxValue * 0.25)}</span>
          <span>0</span>
        </div>

        {/* Bars container */}
        <div className="ml-12 h-full flex items-end">
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * 100;
            const color = colors[index % colors.length];

            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center h-full justify-end group relative"
                style={{ width: `${barWidth}%` }}
              >
                {/* Bar */}
                <div
                  className="w-full rounded-t transition-all hover:opacity-80 cursor-pointer border border-gray-300"
                  style={{
                    height: `${barHeight}%`,
                    backgroundColor: color,
                    minHeight: item.value > 0 ? "2px" : "0",
                  }}
                  title={`${item.label}: ${item.value}`}
                >
                  {/* Value label on top of bar */}
                  {item.value > 0 && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      {item.value}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="ml-12 mt-2 flex">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex-1 text-xs text-gray-600 text-center px-1"
            style={{ width: `${barWidth}%` }}
            title={item.label}
          >
            <div className="truncate">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

