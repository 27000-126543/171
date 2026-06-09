import { create } from 'zustand'
import type { EnergyData, EnergyAlarm } from '@/types'
import { energyData as mockEnergyData, energyAlarms as mockEnergyAlarms } from '@/mock/energy'

interface EnergyState {
  energyData: EnergyData[]
  alarms: EnergyAlarm[]
  addEnergyData: (data: EnergyData) => void
  updateEnergyData: (id: string, data: Partial<EnergyData>) => void
  deleteEnergyData: (id: string) => void
  addAlarm: (alarm: EnergyAlarm) => void
  updateAlarm: (id: string, data: Partial<EnergyAlarm>) => void
  deleteAlarm: (id: string) => void
}

export const useEnergyStore = create<EnergyState>((set) => ({
  energyData: mockEnergyData,
  alarms: mockEnergyAlarms,
  addEnergyData: (data) => set((state) => ({ energyData: [...state.energyData, data] })),
  updateEnergyData: (id, data) => set((state) => ({
    energyData: state.energyData.map((e) => (e.id === id ? { ...e, ...data } : e)),
  })),
  deleteEnergyData: (id) => set((state) => ({ energyData: state.energyData.filter((e) => e.id !== id) })),
  addAlarm: (alarm) => set((state) => ({ alarms: [...state.alarms, alarm] })),
  updateAlarm: (id, data) => set((state) => ({
    alarms: state.alarms.map((a) => (a.id === id ? { ...a, ...data } : a)),
  })),
  deleteAlarm: (id) => set((state) => ({ alarms: state.alarms.filter((a) => a.id !== id) })),
}))
