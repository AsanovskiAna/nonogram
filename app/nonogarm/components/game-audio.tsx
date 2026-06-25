import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import {
  AUDIO_TRACKS,
  getRoundAudioCue,
  type AudioCue,
  type RoundAudioSnapshot,
} from "@/lib/nonogarm/audio.ts";

const AUDIO_STORAGE_KEY = "nonogarm-audio-enabled";

type GameAudioProps = {
  roundSnapshot: RoundAudioSnapshot | null;
};

const CUE_VOLUMES: Record<AudioCue, number> = {
  correct: 0.42,
  wrong: 0.34,
  win: 0.48,
};

function createAudio(src: string, volume: number, loop = false): HTMLAudioElement {
  const audio = new Audio(src);
  audio.loop = loop;
  audio.preload = "auto";
  audio.volume = volume;

  return audio;
}

function getStoredAudioEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(AUDIO_STORAGE_KEY) === "on";
}

export function GameAudio({ roundSnapshot }: GameAudioProps) {
  const [enabled, setEnabled] = useState(getStoredAudioEnabled);
  const loopRef = useRef<HTMLAudioElement | null>(null);
  const previousSnapshotRef = useRef<RoundAudioSnapshot | null>(null);

  useEffect(() => {
    loopRef.current = createAudio(AUDIO_TRACKS.loop, 0.22, true);

    return () => {
      loopRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    const loop = loopRef.current;
    if (!loop) {
      return;
    }

    if (enabled && roundSnapshot?.status === "playing") {
      void loop.play().catch(() => {});
      return;
    }

    loop.pause();
  }, [enabled, roundSnapshot?.status]);

  useEffect(() => {
    const previousSnapshot = previousSnapshotRef.current;
    previousSnapshotRef.current = roundSnapshot;

    if (!enabled) {
      return;
    }

    const cue = getRoundAudioCue(previousSnapshot, roundSnapshot);
    if (!cue) {
      return;
    }

    const audio = createAudio(AUDIO_TRACKS[cue], CUE_VOLUMES[cue]);
    void audio.play().catch(() => {});
  }, [enabled, roundSnapshot]);

  function handleToggleAudio() {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    window.localStorage.setItem(AUDIO_STORAGE_KEY, nextEnabled ? "on" : "off");
  }

  const Icon = enabled ? Volume2 : VolumeX;

  return (
    <div className="flex">
      <button
        aria-pressed={enabled}
        className={`inline-flex min-h-12 w-full items-center justify-between gap-2 border-4 border-black px-4 py-2 font-mono text-base font-black uppercase shadow-[5px_5px_0_#000] transition-transform hover:-translate-y-0.5 sm:text-lg ${
          enabled ? "bg-[#caff24]" : "bg-white"
        }`}
        onClick={handleToggleAudio}
        type="button"
      >
        <Icon className="size-6 stroke-[3]" aria-hidden="true" />
        Music
      </button>
    </div>
  );
}
