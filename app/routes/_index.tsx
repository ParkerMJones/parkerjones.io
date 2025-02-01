import type { MetaFunction } from "@remix-run/node";
import AudioPlayerVisualizer from "~/components/audio-visualizer";

export const meta: MetaFunction = () => {
  return [
    { title: "Parker Jones" },
    { name: "description", content: "parkerjones.io" },
  ];
};

export default function Index() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-950 px-3 py-12 font-mono">
      <h1 className="text-4xl font-bold text-center text-white pt-6">Music</h1>
      <div className="flex flex-col gap-3 mt-12">
        <p className="text-xl font-bold underline text-white mb-3">
          January 2025
        </p>
        <AudioPlayerVisualizer
          audioSrc="/audio/testin_pistin_2.mp3"
          colors={["#4d9dff", "#ff4d8e", "#ffd54d", "#681b98", "#00bdad"]}
        />
        <AudioPlayerVisualizer
          audioSrc="/audio/testin_pistin_1.mp3"
          colors={["#1f2942", "#3c4a68", "#4f7a92", "#a1d6d9", "#e53838"]}
        />
        <AudioPlayerVisualizer
          audioSrc="/audio/housey_jame_riff.mp3"
          colors={["#ff4d4d", "#ffcc4d", "#ffff4d", "#4dff4d", "#4dffff"]}
        />
      </div>
    </div>
  );
}
