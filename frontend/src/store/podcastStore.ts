import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Status = 'idle' | 'queued' | 'pending' | 'running' | 'done' | 'error';

interface PodcastState {
    jobId: string | null;
    status: Status;
    script: string;
    voiceBase64: string | null;

    setJobId: (id: string | null) => void;
    setStatus: (s: Status) => void;
    setResult: (script: string, voiceBase64: string) => void;
    reset: () => void;
}

export const usePodcastStore = create<PodcastState>()(
    persist(
        (set) => ({
            jobId: null,
            status: 'idle',
            script: '',
            voiceBase64: null,

            setJobId: (id) => set({ jobId: id, status: id ? 'pending' : 'idle' }),
            setStatus: (s) => set({ status: s }),
            setResult: (script, voiceBase64) => set({ script, voiceBase64, status: 'done' }),
            reset: () => set({ jobId: null, status: 'idle', script: '', voiceBase64: null }),
        }),
        { name: 'podcast-store' }
    )
);
