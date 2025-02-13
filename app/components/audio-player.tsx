"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

interface AudioPlayerProps {
  id: string;
  title: string;
  artist: string;
  description: string;
  audioSrc: string;
  onPlay: () => void;
}

const AudioPlayer = ({
  id,
  title,
  artist,
  description,
  audioSrc,
  onPlay,
}: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 🎯 Audio Context Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener("timeupdate", updateTime);
      audioRef.current.addEventListener("loadedmetadata", () => {
        setDuration(audioRef.current!.duration);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("timeupdate", updateTime);
      }
    };
  }, []);

  const updateTime = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;

    // 🔥 FIX: Ensure AudioContext is resumed before playing
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // 🎯 FIX: Call visualizeAudio before playing to ensure it's connected
      visualizeAudio();
      audioRef.current.play().catch((err) => {
        console.error("Playback failed:", err);
      });
      onPlay();
    }

    setIsPlaying(!isPlaying);
  };

  const seekAudio = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (audioRef.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const seekTime = (x / rect.width) * duration;
      audioRef.current.currentTime = seekTime;
    }
  };

  const visualizeAudio = () => {
    if (!audioRef.current || !canvasRef.current) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;

    if (!sourceRef.current) {
      sourceRef.current = audioContext.createMediaElementSource(
        audioRef.current
      );
      analyserRef.current = audioContext.createAnalyser();

      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContext.destination);
    }

    const analyser = analyserRef.current;
    if (!analyser) return;

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d")!;
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const draw = () => {
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = "rgb(255, 255, 255)";
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      const barWidth = (WIDTH / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
        canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{artist}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">{description}</div>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width="640"
            height="100"
            className="w-full cursor-pointer"
            onClick={seekAudio}
          ></canvas>
          <div
            className="absolute top-0 left-0 h-full bg-primary/30"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          ></div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Button onClick={togglePlayPause} variant="outline" size="icon">
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <div>
            {Math.floor(currentTime)}s / {Math.floor(duration)}s
          </div>
        </div>
        <audio ref={audioRef} src={audioSrc}>
          <track kind="captions" />
        </audio>
      </CardContent>
    </Card>
  );
};

export { AudioPlayer };
