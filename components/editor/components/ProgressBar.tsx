import { formatTime } from "../utils/videoUtils";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export function ProgressBar({
  currentTime,
  duration,
  onSeek,
}: ProgressBarProps) {
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    onSeek(newTime);
  };

  const progressPercentage = (currentTime / (duration || 1)) * 100;

  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-700 dark:text-gray-300 text-xs font-medium min-w-12 tabular-nums">
        {formatTime(currentTime)}
      </span>
      <div className="flex-1 relative group">
        {/* 백그라운드 트랙 */}
        <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>

        {/* 진행된 부분 */}
        <div
          className="absolute top-0 left-0 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"
          style={{ width: `${progressPercentage}%` }}
        ></div>

        {/* 실제 input (투명) */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.01}
          value={currentTime}
          onChange={handleSeek}
          className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer focus:outline-none"
        />

        {/* 썸 (호버 시에만 표시) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-4 w-4 bg-blue-600 dark:bg-blue-400 rounded-full shadow-lg border-2 border-white dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{
            left: `calc(${progressPercentage}% - 8px)`,
          }}
        />
      </div>
      <span className="text-gray-700 dark:text-gray-300 text-xs font-medium min-w-12 tabular-nums">
        {formatTime(duration)}
      </span>
    </div>
  );
}
