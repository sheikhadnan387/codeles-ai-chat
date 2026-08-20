import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  /** Desktop: whether the sidebar is collapsed to a thin rail. */
  isSidebarCollapsed: boolean;
  /** Mobile: whether the sidebar drawer (Sheet) is open. */
  isMobileSidebarOpen: boolean;
  isSettingsOpen: boolean;
  settingsInitialTab: string | null;
  /** Default model id preselected for brand-new conversations (Settings > AI Model). */
  preferredModelId: string | null;

  toggleSidebarCollapsed: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  openSettings: (tab?: string) => void;
  closeSettings: () => void;
  setPreferredModelId: (modelId: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      isMobileSidebarOpen: false,
      isSettingsOpen: false,
      settingsInitialTab: null,
      preferredModelId: null,

      toggleSidebarCollapsed: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),
      openSettings: (tab) => set({ isSettingsOpen: true, settingsInitialTab: tab ?? null }),
      closeSettings: () => set({ isSettingsOpen: false }),
      setPreferredModelId: (modelId) => set({ preferredModelId: modelId }),
    }),
    {
      name: "codeles-ui-preferences",
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
        preferredModelId: state.preferredModelId,
      }),
    },
  ),
);
