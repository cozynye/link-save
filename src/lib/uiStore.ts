import { create } from 'zustand'
import { EMPTY_FILTER, type LinkFilter } from '@/features/search/filterLinks'
import type { SortKey } from '@/features/search/sortLinks'

export type SettingsTab = 'connection' | 'tags' | 'appearance' | 'quick-save'

export interface UiState {
  filter: LinkFilter
  sort: SortKey
  captureUrl: string | null
  pendingCaptureUrl: string | null
  detailId: string | null
  settingsOpen: boolean
  settingsTab: SettingsTab

  setQuery(query: string): void
  toggleTag(id: string): void
  clearTags(): void
  removeTagFromFilter(id: string): void
  setPinnedOnly(pinnedOnly: boolean): void
  resetFilter(): void
  setSort(sort: SortKey): void
  openCapture(url: string): void
  closeCapture(): void
  setPendingCaptureUrl(url: string | null): void
  openDetail(id: string): void
  closeDetail(): void
  openSettings(tab?: SettingsTab): void
  closeSettings(): void
}

const initialState = {
  filter: EMPTY_FILTER,
  sort: 'newest' as SortKey,
  captureUrl: null,
  pendingCaptureUrl: null,
  detailId: null,
  settingsOpen: false,
  settingsTab: 'connection' as SettingsTab,
}

const closedSheets = { captureUrl: null, detailId: null, settingsOpen: false }

export const useUiStore = create<UiState>()((set) => ({
  ...initialState,
  setQuery: (query) => set((s) => ({ filter: { ...s.filter, query } })),
  toggleTag: (id) =>
    set((s) => ({
      filter: { ...s.filter, tagIds: s.filter.tagIds.includes(id) ? s.filter.tagIds.filter((t) => t !== id) : [...s.filter.tagIds, id] },
    })),
  clearTags: () => set((s) => ({ filter: { ...s.filter, tagIds: [] } })),
  removeTagFromFilter: (id) => set((s) => ({ filter: { ...s.filter, tagIds: s.filter.tagIds.filter((t) => t !== id) } })),
  setPinnedOnly: (pinnedOnly) => set((s) => ({ filter: { ...s.filter, pinnedOnly } })),
  resetFilter: () => set({ filter: EMPTY_FILTER }),
  setSort: (sort) => set({ sort }),
  openCapture: (url) => set({ ...closedSheets, captureUrl: url }),
  closeCapture: () => set({ captureUrl: null }),
  setPendingCaptureUrl: (url) => set({ pendingCaptureUrl: url }),
  openDetail: (id) => set({ ...closedSheets, detailId: id }),
  closeDetail: () => set({ detailId: null }),
  openSettings: (tab = 'connection') => set({ ...closedSheets, settingsOpen: true, settingsTab: tab }),
  closeSettings: () => set({ settingsOpen: false }),
}))

export function resetUiStoreForTests(): void {
  useUiStore.setState(initialState)
}
