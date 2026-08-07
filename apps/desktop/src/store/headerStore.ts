import * as React from "react"
import { create } from "zustand"

export interface HeaderState {
  left: React.ReactNode | null
  center: React.ReactNode | null
  right: React.ReactNode | null
}

interface HeaderActions {
  setLeft: (left: React.ReactNode | null) => void
  setCenter: (center: React.ReactNode | null) => void
  setRight: (right: React.ReactNode | null) => void
  setHeader: (header: Partial<HeaderState>) => void
  resetHeader: () => void
}

const initialState: HeaderState = {
  left: null,
  center: null,
  right: null,
}

export const useHeaderStore = create<HeaderState & HeaderActions>((set) => ({
  ...initialState,
  setLeft: (left) => set({ left }),
  setCenter: (center) => set({ center }),
  setRight: (right) => set({ right }),
  setHeader: (header) => set((state) => ({ ...state, ...header })),
  resetHeader: () => set(initialState),
}))

export function useHeaderActions(): HeaderActions {
  const setLeft = useHeaderStore((state) => state.setLeft)
  const setCenter = useHeaderStore((state) => state.setCenter)
  const setRight = useHeaderStore((state) => state.setRight)
  const setHeader = useHeaderStore((state) => state.setHeader)
  const resetHeader = useHeaderStore((state) => state.resetHeader)

  return { setLeft, setCenter, setRight, setHeader, resetHeader }
}
