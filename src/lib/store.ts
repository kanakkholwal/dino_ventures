import { create } from "zustand";
import type { VideoWithCategory } from "./data";

interface PlayerState {
    activeVideo: VideoWithCategory | null;
    isPlaying: boolean;
    isMinimized: boolean;
    isExpanded: boolean;

    play: (video: VideoWithCategory) => void;
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    setPlaying: (playing: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
    activeVideo: null,
    isPlaying: false,
    isMinimized: false,
    isExpanded: false,

    play: (video) =>
        set({
            activeVideo: video,
            isExpanded: true,
            isMinimized: false,
            isPlaying: true,
        }),
    minimize: () => set({ isMinimized: true, isExpanded: true }),
    maximize: () => set({ isMinimized: false, isExpanded: true }),
    close: () =>
        set({
            activeVideo: null,
            isExpanded: false,
            isMinimized: false,
            isPlaying: false,
        }),
    setPlaying: (isPlaying) => set({ isPlaying }),
}));
