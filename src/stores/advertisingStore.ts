import { create } from 'zustand'
import type { AdSpace, AdNotification } from '@/types'
import { adSpaces as mockAdSpaces } from '@/mock/advertising'

interface AdvertisingState {
  adSpaces: AdSpace[]
  notifications: AdNotification[]
  addAdSpace: (ad: AdSpace) => void
  updateAdSpace: (id: string, data: Partial<AdSpace>) => void
  deleteAdSpace: (id: string) => void
  addNotification: (notification: AdNotification) => void
}

export const useAdvertisingStore = create<AdvertisingState>((set) => ({
  adSpaces: mockAdSpaces,
  notifications: [],
  addAdSpace: (ad) => set((state) => ({ adSpaces: [...state.adSpaces, ad] })),
  updateAdSpace: (id, data) => set((state) => ({
    adSpaces: state.adSpaces.map((a) => (a.id === id ? { ...a, ...data } : a)),
  })),
  deleteAdSpace: (id) => set((state) => ({ adSpaces: state.adSpaces.filter((a) => a.id !== id) })),
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
  })),
}))
