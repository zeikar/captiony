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

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggleMute}
        className="text-white hover:text-blue-400 transition-colors"
        aria-label={volume > 0 ? "Mute" : "Unmute"}
      >
        {volume > 0 ? (
          <SpeakerWaveIcon className="h-6 w-6" />
        ) : (
          <SpeakerXMarkIcon className="h-6 w-6" />
        )}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.1}
        value={volume}
        onChange={handleVolumeChange}
        className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer hover:bg-gray-600 transition-colors"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
            volume * 100
          }%, #374151 ${volume * 100}%, #374151 100%)`,
        }}
        aria-label="Volume"
      />
    </div>
  );
}
