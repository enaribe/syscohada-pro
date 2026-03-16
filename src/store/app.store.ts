'use client'

import { create } from 'zustand'

type AppState = {
  entrepriseId: string
  exerciceId: string
  exerciceAnnee: number
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  setEntreprise: (entrepriseId: string) => void
  setExercice: (exerciceId: string, annee: number) => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  entrepriseId: '',
  exerciceId: '',
  exerciceAnnee: new Date().getFullYear(),
  theme: 'light',
  sidebarOpen: true,
  setEntreprise: (entrepriseId) => set({ entrepriseId }),
  setExercice: (exerciceId, annee) => set({ exerciceId, exerciceAnnee: annee }),
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
