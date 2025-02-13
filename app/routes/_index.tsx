"use client";

import { useState, useEffect } from "react";
import { AudioPlayer } from "~/components/audio-player";
import { useAudioPlayer } from "~/hooks/use-audio-player";
import { useInView } from "react-intersection-observer";
import { myTrax } from "~/utils/tracks";

export type Track = {
  id: string;
  title: string;
  artist: string;
  description: string;
  audioSrc: string;
  uploadDate: string;
};

export default function Home() {
  const { currentlyPlayingId, handlePlay } = useAudioPlayer();

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Music Blog</h1>
      <div className="space-y-8">
        {myTrax.map((track) => (
          <AudioPlayer
            key={track.id}
            id={track.id}
            title={track.title}
            artist={track.artist}
            description={track.description}
            audioSrc={track.audioSrc}
            onPlay={() => handlePlay(track.id)}
          />
        ))}
      </div>
      {/* <div ref={ref} className="h-10" /> */}
    </div>
  );
}
