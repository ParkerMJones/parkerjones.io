// app/components/AudioPlayerVisualizer.tsx
import React, { useEffect, useRef, useState } from "react";
import { useWindowSize } from "@uidotdev/usehooks";
import { Pause, Play } from "react-feather";

// Module-scoped variable to track the currently playing audio element.
let currentlyPlayingAudio: HTMLAudioElement | null = null;

export interface AudioPlayerVisualizerProps {
  audioSrc: string;
  /** Array of hex color strings to use for the progress gradient and container animations */
  colors: string[];
  artist?: string;
  title?: string;
}

const AudioPlayerVisualizer: React.FC<AudioPlayerVisualizerProps> = ({
  audioSrc,
  colors,
  artist = "Soudant",
  title = "untitled",
}) => {
  // Generate a unique ID for this instance (used for unique keyframe names).
  const uniqueIdRef = useRef(
    "id-" + Math.random().toString(36).substring(2, 8)
  );
  const uniqueId = uniqueIdRef.current;

  // Use window size to compute sizes.
  const { width: windowWidth } = useWindowSize();
  // Use about 60–70% of the window width for the canvas.
  const canvasWidth = windowWidth ? Math.floor(windowWidth * 0.8) : 200;
  const canvasHeight = 100; // fixed height

  // Define line widths for drawing the waveform.
  const fullLineWidth = 2;
  const progressLineWidth = 3;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // State for the precomputed waveform, duration, play state, and decoded audio.
  const [waveform, setWaveform] = useState<number[]>([]);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  // Ref for the drawing loop's animation frame ID.
  const animationFrameIdRef = useRef<number | null>(null);

  // ────────── Helper: Simple moving-average smoothing ──────────
  const smoothArray = (data: number[], windowSize: number): number[] => {
    const smoothed: number[] = [];
    const halfWindow = Math.floor(windowSize / 2);
    for (let i = 0; i < data.length; i++) {
      let sum = 0,
        count = 0;
      for (let j = i - halfWindow; j <= i + halfWindow; j++) {
        if (j >= 0 && j < data.length) {
          sum += data[j];
          count++;
        }
      }
      smoothed.push(sum / count);
    }
    return smoothed;
  };

  // ────────── Helper: Convert hex color to rgba string with given alpha ──────────
  const hexToRgba = (hex: string, alpha: number): string => {
    let normalized = hex.replace("#", "");
    if (normalized.length === 3) {
      normalized = normalized
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const r = parseInt(normalized.substring(0, 2), 16);
    const g = parseInt(normalized.substring(2, 4), 16);
    const b = parseInt(normalized.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  // ────────── STEP 1: Load and decode the audio file ──────────
  useEffect(() => {
    const AudioContext = window.AudioContext;
    const decodingContext = new AudioContext();
    fetch(audioSrc)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => decodingContext.decodeAudioData(arrayBuffer))
      .then((decodedAudio) => {
        setAudioBuffer(decodedAudio);
        setDuration(decodedAudio.duration);
      })
      .catch((err) => {
        console.error("Error loading or decoding audio:", err);
      });
    return () => {
      decodingContext.close();
    };
  }, [audioSrc]);

  // ────────── STEP 2: Compute (and smooth) the waveform ──────────
  useEffect(() => {
    if (!audioBuffer) return;
    const channelData = audioBuffer.getChannelData(0);
    const samplesPerPixel = Math.floor(channelData.length / canvasWidth);
    const waveformData: number[] = new Array(canvasWidth).fill(0);
    for (let i = 0; i < canvasWidth; i++) {
      let sum = 0,
        count = 0;
      const start = i * samplesPerPixel;
      const end = start + samplesPerPixel;
      for (let j = start; j < end && j < channelData.length; j++) {
        sum += channelData[j] * channelData[j];
        count++;
      }
      const rms = count ? Math.sqrt(sum / count) : 0;
      waveformData[i] = rms;
    }
    // Minimal smoothing (window size 1) for responsiveness.
    const smoothedWaveform = smoothArray(waveformData, 3);
    setWaveform(smoothedWaveform);
  }, [audioBuffer, canvasWidth]);

  // ────────── STEP 3: Drawing loop for the waveform ──────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (waveform.length) {
        // Draw the full waveform in white.
        ctx.beginPath();
        for (let i = 0; i < waveform.length; i++) {
          const amplitude = waveform[i];
          const x = i;
          const y = canvas.height - amplitude * canvas.height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "white";
        ctx.lineWidth = fullLineWidth;
        ctx.stroke();

        // Draw the played portion with a forward gradient.
        if (audioRef.current && duration > 0) {
          const currentTime = audioRef.current.currentTime;
          const progress = currentTime / duration;
          const progressX = Math.floor(progress * canvas.width);
          const gradient = ctx.createLinearGradient(0, 0, progressX, 0);
          colors.forEach((color, index) => {
            const stop = index / (colors.length - 1);
            gradient.addColorStop(stop, color);
          });
          ctx.beginPath();
          for (let i = 0; i < progressX && i < waveform.length; i++) {
            const amplitude = waveform[i];
            const x = i;
            const y = canvas.height - amplitude * canvas.height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = gradient;
          ctx.lineWidth = progressLineWidth;
          ctx.stroke();
        }
      }
      animationFrameIdRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      if (animationFrameIdRef.current)
        cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [waveform, duration, colors]);

  // ────────── STEP 4: Click-to-seek on the canvas ──────────
  const handleCanvasClick = (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (!canvasRef.current || !audioRef.current || duration === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = clickX / canvasRef.current.width;
    const newTime = progress * duration;
    audioRef.current.currentTime = newTime;
  };

  // ────────── STEP 5: Auto-pause at track end & update state on external pause ──────────
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    const handleEnded = () => {
      setIsPlaying(false);
      if (currentlyPlayingAudio === audioEl) {
        currentlyPlayingAudio = null;
      }
    };
    const handlePause = () => {
      setIsPlaying(false);
      if (currentlyPlayingAudio === audioEl) {
        currentlyPlayingAudio = null;
      }
    };
    audioEl.addEventListener("ended", handleEnded);
    audioEl.addEventListener("pause", handlePause);
    return () => {
      audioEl.removeEventListener("ended", handleEnded);
      audioEl.removeEventListener("pause", handlePause);
    };
  }, []);

  // ────────── STEP 6: Play/Pause toggle with global control ──────────
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (currentlyPlayingAudio === audioRef.current) {
        currentlyPlayingAudio = null;
      }
    } else {
      // Pause any other currently playing audio.
      if (currentlyPlayingAudio && currentlyPlayingAudio !== audioRef.current) {
        currentlyPlayingAudio.pause();
      }
      audioRef.current.play();
      setIsPlaying(true);
      currentlyPlayingAudio = audioRef.current;
    }
  };

  // ────────── Build Keyframes for Animated Backgrounds ──────────
  // Outer container background (30% opacity) cycles through provided colors.
  const outerKeyframes = `
    @keyframes cycleBg-${uniqueId} {
      0% { background-color: ${hexToRgba(colors[0], 0.2)}; }
      25% { background-color: ${hexToRgba(colors[1], 0.2)}; }
      50% { background-color: ${hexToRgba(colors[2], 0.2)}; }
      75% { background-color: ${hexToRgba(colors[3], 0.2)}; }
      100% { background-color: ${hexToRgba(colors[4], 0.2)}; }
    }
  `;
  // Button container border cycles through provided colors (100% opacity).
  const btnKeyframes = `
    @keyframes cycleBtn-${uniqueId} {
      0% { background-color: ${colors[0]}; border-color: ${colors[0]}; }
      25% { background-color: ${colors[1]}; border-color: ${colors[1]}; }
      50% { background-color: ${colors[2]}; border-color: ${colors[2]}; }
      75% { background-color: ${colors[3]}; border-color: ${colors[3]};}
      100% { background-color: ${colors[4]}; border-color: ${colors[4]}; }
    }
  `;

  return (
    <>
      <style>{outerKeyframes + btnKeyframes}</style>
      {/* Outer wrapper: full width with at least 24px (px-6) padding */}
      <div className="w-full" style={{ boxSizing: "border-box" }}>
        <div
          className="flex flex-col justify-center gap-8 text-center rounded-xl p-[18px]"
          style={{
            // When playing, animate the container background; when paused, transparent.
            maxWidth: Math.floor(windowWidth || 400 * 0.8),
            backgroundColor: isPlaying ? undefined : "transparent",
            animation: isPlaying
              ? `cycleBg-${uniqueId} 10s linear infinite alternate`
              : undefined,
          }}
        >
          {/* Play/Pause button container */}

          {/* Canvas for waveform */}
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="block cursor-pointer"
            onClick={handleCanvasClick}
          />
          <div className="flex gap-6 items-center">
            <div
              className="h-20 w-20 rounded-2xl px-4 flex items-center justify-center"
              style={{
                border: "3px solid",
                // When playing, animate the border; when paused, solid white.
                borderColor: isPlaying ? undefined : "white",
                animation: isPlaying
                  ? `cycleBtn-${uniqueId} 10s linear infinite alternate`
                  : undefined,
              }}
            >
              <button
                onClick={handlePlayPause}
                className="bg-none border-none cursor-pointer"
              >
                {isPlaying ? (
                  <Pause color="white" size={40} strokeWidth={1} />
                ) : (
                  <Play color="white" size={40} strokeWidth={1} />
                )}
              </button>
            </div>
            <div className="flex flex-col gap-2 text-left">
              <p className="text-white text-lg font-semibold">{artist}</p>
              <p className="text-white text-lg font-normal">{title}</p>
            </div>
          </div>
          {/* Hidden audio element */}
          <audio
            ref={audioRef}
            src={audioSrc}
            preload="auto"
            style={{ display: "none" }}
            aria-hidden="true"
          >
            <track kind="captions" src="" default />
          </audio>
        </div>
      </div>
    </>
  );
};

export default AudioPlayerVisualizer;
