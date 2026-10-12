import { create } from 'zustand';

import { waitForCounterWrites } from '@/features/counters/store';

import { listHistoryEvents, type HistoryEventRow } from './repository';

type HistoryState = {
  events: HistoryEventRow[];
  viewedAt: number;
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
};

export const useHistoryStore = create<HistoryState>((set) => ({
  events: [],
  viewedAt: 0,
  isLoading: true,
  error: null,
  load: async () => {
    set({ isLoading: true, error: null });
    try {
      // カウント直後に開いても、未保存の count_events を取りこぼさない
      await waitForCounterWrites();
      const events = await listHistoryEvents();
      set({ events, viewedAt: Date.now(), isLoading: false, error: null });
    } catch (e: unknown) {
      console.warn('履歴を読み込めませんでした', e);
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : '履歴を読み込めませんでした',
      });
    }
  },
}));
