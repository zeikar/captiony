import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/solid";

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
}

export function VolumeControl({
  volume,
  onVolumeChange,
  onToggleMute,
}: VolumeControlProps) {
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
  };

  const volumePercentage = volume * 100;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onToggleMute}
        className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        aria-label={volume > 0 ? "Mute" : "Unmute"}
      >
        {volume > 0 ? (
          <SpeakerWaveIcon className="h-5 w-5" />
        ) : (
          <SpeakerXMarkIcon className="h-5 w-5" />
        )}
      </button>
      <div className="relative group">
        {/* 백그라운드 트랙 */}
        <div className="w-20 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>

        {/* 볼륨 레벨 */}
        <div
          className="absolute top-0 left-0 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"
          style={{ width: `${volumePercentage}%` }}
        ></div>

        {/* 실제 input (투명) */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={volume}
          onChange={handleVolumeChange}
          className="absolute top-0 left-0 w-20 h-2 opacity-0 cursor-pointer focus:outline-none"
          aria-label="Volume"
        />

        {/* 썸 (호버 시에만 표시) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-4 w-4 bg-blue-600 dark:bg-blue-400 rounded-full shadow-lg border-2 border-white dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{
            left: `calc(${volumePercentage}% - 8px)`,
          }}
        />
      </div>
    </div>
  );
}
