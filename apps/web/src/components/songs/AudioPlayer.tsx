import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { formatTime } from '../../utils/helpers';

const RANGE =
  'h-1 cursor-pointer appearance-none rounded-full bg-transparent [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:opacity-0 [&::-webkit-slider-thumb]:transition group-hover/player:[&::-webkit-slider-thumb]:opacity-100';

const fill = (percent: number) => ({
  background: `linear-gradient(to right, var(--color-lime-300) ${percent}%, rgb(255 255 255 / 0.12) ${percent}%)`,
});

interface AudioPlayerProps {
  src: string;
  title: string;
  compact?: boolean; // no volume controls, for narrow cards
  autoPlay?: boolean;
}

export default function AudioPlayer({ src, title, compact, autoPlay }: AudioPlayerProps) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [unavailable, setUnavailable] = useState(false);
  // One song at a time: another player starting pauses this one
  useEffect(() => {
    const handlePlay = (e: Event) => {
      if (e.target !== audio.current) audio.current?.pause();
    };
    document.addEventListener('play', handlePlay, true);
    return () => document.removeEventListener('play', handlePlay, true);
  }, []);
  const handleToggle = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => setUnavailable(true));
    else el.pause();
  };
  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audio.current) audio.current.currentTime = time;
    setCurrent(time);
  };
  const handleVolume = (e: ChangeEvent<HTMLInputElement>) => {
    const level = Number(e.target.value);
    if (audio.current) audio.current.volume = level;
    setVolume(level);
  };
  const handleMute = () => {
    const level = volume ? 0 : 1;
    if (audio.current) audio.current.volume = level;
    setVolume(level);
  };
  const percent = duration ? (current / duration) * 100 : 0;

  return (
    <div className="group/player flex min-w-0 items-center gap-3">
      <audio
        ref={audio}
        src={src}
        autoPlay={autoPlay}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onError={() => setUnavailable(true)}
      />
      <button
        type="button"
        onClick={handleToggle}
        disabled={unavailable}
        aria-label={`${playing ? 'Pause' : 'Play'} ${title}`}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-ink-950 transition hover:scale-105 hover:bg-lime-300 active:scale-95 disabled:bg-ink-700 disabled:text-slate-500 motion-reduce:transition-none motion-reduce:hover:scale-100"
      >
        {playing ? (
          <Pause className="size-4 fill-current" />
        ) : (
          <Play className="size-4 translate-x-px fill-current" />
        )}
      </button>
      {unavailable ? (
        <span className="text-xs text-slate-500">Audio unavailable</span>
      ) : (
        <>
          <span className="w-9 shrink-0 text-right text-[11px] text-slate-400 tabular-nums">
            {formatTime(current)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={handleSeek}
            aria-label={`Seek ${title}`}
            style={fill(percent)}
            className={`${RANGE} min-w-0 flex-1`}
          />
          <span className="w-9 shrink-0 text-[11px] text-slate-500 tabular-nums">
            {formatTime(duration)}
          </span>
          {!compact && (
            <>
              <button
                type="button"
                onClick={handleMute}
                aria-label={volume ? 'Mute' : 'Unmute'}
                className="hidden shrink-0 text-slate-400 transition hover:text-white sm:block"
              >
                {volume ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={handleVolume}
                aria-label="Volume"
                style={fill(volume * 100)}
                className={`${RANGE} hidden w-16 shrink-0 lg:block`}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
