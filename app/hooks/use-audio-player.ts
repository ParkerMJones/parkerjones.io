"use client";

import { useState, useCallback } from "react";

export function useAudioPlayer() {
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(
    null
  );

  const handlePlay = useCallback((id: string) => {
    setCurrentlyPlayingId(id);
  }, []);

  return { currentlyPlayingId, handlePlay };
}
