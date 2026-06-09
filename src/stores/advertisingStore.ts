import { create } from 'zustand'
import type { AdSpace } from '@/types'
import { adSpaces as mockAdSpaces } from '@/mock/advertising'

interface AdvertisingState {
  adSpaces: AdSpace[]
  addAdSpace: (ad: AdSpace) => void
  updateAdSpace: (id: string, data: Partial<AdSpace>) => void
  deleteAdSpace: (id: string) => void
}

export const useAdvertisingStore = create<AdvertisingState>((set) => ({
  adSpaces: mockAdSpaces,
  addAdSpace: (ad) => set((state) => ({ adSpaces: [...state.adSpaces, ad] })),
  updateAdSpace: (id, data) => set((state) => ({
    adSpaces: state.adSpaces.map((a) => (a.id === id ? { ...a, ...data } : a)),
  })),
  deleteAdSpace: (id) => set((state) => ({ adSpaces: state.adSpaces.filter((a) => a.id !== id) })),
}))
