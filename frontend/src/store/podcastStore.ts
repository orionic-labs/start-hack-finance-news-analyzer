// store/podcastStore.ts
import { create } from 'zustand';

interface PodcastState {
    jobId: string | null;
    setJobId: (id: string | null) => void;
}

export const usePodcastStore = create<PodcastState>((set) => ({
    jobId: null,
    setJobId: (id) => set({ jobId: id }),
}));
