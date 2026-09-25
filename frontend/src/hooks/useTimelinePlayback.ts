import { useEffect, useMemo, useRef, useState } from "react";
import type { TimelineTrack } from "../types/TimelineTrack";

/**
 * 时间轴播放：按 requestAnimationFrame 推进 currentMs，
 * 并给出当前时刻命中的轨道（含已结束仍保持末帧的逻辑由调用方决定）。
 */
export function useTimelinePlayback(tracks: TimelineTrack[]) {
  const durationMs = useMemo(() => {
    const end = tracks.reduce(
      (max, track) => Math.max(max, track.start_ms + track.duration_ms),
      0
    );
    // 末尾留出 2 秒黑场观察时间。
    return end + 2000;
  }, [tracks]);

  const [currentMs, setCurrentMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const originRef = useRef<{ wall: number; at: number } | null>(null);

  useEffect(() => {
    if (!playing) return;
    const tick = (wall: number) => {
      const origin = originRef.current;
      if (!origin) return;
      const next = origin.at + (wall - origin.wall);
      if (next >= durationMs) {
        setCurrentMs(durationMs);
        setPlaying(false);
        originRef.current = null;
        return;
      }
      setCurrentMs(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, durationMs]);

  const play = () => {
    originRef.current = { wall: performance.now(), at: currentMs };
    setPlaying(true);
  };
  const pause = () => setPlaying(false);
  const stop = () => {
    setPlaying(false);
    originRef.current = null;
    setCurrentMs(0);
  };
  const seek = (ms: number) => {
    const clamped = Math.min(durationMs, Math.max(0, ms));
    originRef.current = playing
      ? { wall: performance.now(), at: clamped }
      : originRef.current;
    setCurrentMs(clamped);
  };

  const activeTracks = useMemo(
    () =>
      tracks.filter(
        (track) =>
          currentMs >= track.start_ms &&
          currentMs < track.start_ms + track.duration_ms
      ),
    [tracks, currentMs]
  );

  return {
    currentMs,
    durationMs,
    playing,
    activeTracks,
    play,
    pause,
    stop,
    seek
  };
}
