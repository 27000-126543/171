import { create } from 'zustand'
import type { ParkingSpot, VipReservation } from '@/types'
import { parkingSpots as mockParkingSpots, vipReservations as mockVipReservations } from '@/mock/parking'

interface ParkingState {
  parkingSpots: ParkingSpot[]
  vipReservations: VipReservation[]
  addParkingSpot: (spot: ParkingSpot) => void
  updateParkingSpot: (id: string, data: Partial<ParkingSpot>) => void
  deleteParkingSpot: (id: string) => void
  addVipReservation: (reservation: VipReservation) => void
  updateVipReservation: (id: string, data: Partial<VipReservation>) => void
  deleteVipReservation: (id: string) => void
}

export const useParkingStore = create<ParkingState>((set) => ({
  parkingSpots: mockParkingSpots,
  vipReservations: mockVipReservations,
  addParkingSpot: (spot) => set((state) => ({ parkingSpots: [...state.parkingSpots, spot] })),
  updateParkingSpot: (id, data) => set((state) => ({
    parkingSpots: state.parkingSpots.map((s) => (s.id === id ? { ...s, ...data } : s)),
  })),
  deleteParkingSpot: (id) => set((state) => ({ parkingSpots: state.parkingSpots.filter((s) => s.id !== id) })),
  addVipReservation: (reservation) => set((state) => ({ vipReservations: [...state.vipReservations, reservation] })),
  updateVipReservation: (id, data) => set((state) => ({
    vipReservations: state.vipReservations.map((r) => (r.id === id ? { ...r, ...data } : r)),
  })),
  deleteVipReservation: (id) => set((state) => ({ vipReservations: state.vipReservations.filter((r) => r.id !== id) })),
}))
