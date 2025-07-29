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

  return (
    <div className="flex items-center gap-2">
      <span className="text-white text-sm min-w-12">
        {formatTime(currentTime)}
      </span>
      <input
        type="range"
        min={0}
        max={duration || 100}
        value={currentTime}
        onChange={handleSeek}
        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer hover:bg-gray-600 transition-colors"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
            (currentTime / (duration || 1)) * 100
          }%, #374151 ${(currentTime / (duration || 1)) * 100}%, #374151 100%)`,
        }}
      />
      <span className="text-white text-sm min-w-12">
        {formatTime(duration)}
      </span>
    </div>
  );
}
