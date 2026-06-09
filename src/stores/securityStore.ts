import { create } from 'zustand'
import type { SecurityStaff, SecurityShift, IncidentEvent } from '@/types'
import { securityStaff as mockSecurityStaff, securityShifts as mockSecurityShifts, incidentEvents as mockIncidentEvents } from '@/mock/security'

interface SecurityState {
  staff: SecurityStaff[]
  shifts: SecurityShift[]
  incidents: IncidentEvent[]
  addStaff: (staff: SecurityStaff) => void
  updateStaff: (id: string, data: Partial<SecurityStaff>) => void
  deleteStaff: (id: string) => void
  addShift: (shift: SecurityShift) => void
  updateShift: (id: string, data: Partial<SecurityShift>) => void
  deleteShift: (id: string) => void
  addIncident: (incident: IncidentEvent) => void
  updateIncident: (id: string, data: Partial<IncidentEvent>) => void
  deleteIncident: (id: string) => void
}

export const useSecurityStore = create<SecurityState>((set) => ({
  staff: mockSecurityStaff,
  shifts: mockSecurityShifts,
  incidents: mockIncidentEvents,
  addStaff: (s) => set((state) => ({ staff: [...state.staff, s] })),
  updateStaff: (id, data) => set((state) => ({
    staff: state.staff.map((s) => (s.id === id ? { ...s, ...data } : s)),
  })),
  deleteStaff: (id) => set((state) => ({ staff: state.staff.filter((s) => s.id !== id) })),
  addShift: (shift) => set((state) => ({ shifts: [...state.shifts, shift] })),
  updateShift: (id, data) => set((state) => ({
    shifts: state.shifts.map((s) => (s.id === id ? { ...s, ...data } : s)),
  })),
  deleteShift: (id) => set((state) => ({ shifts: state.shifts.filter((s) => s.id !== id) })),
  addIncident: (incident) => set((state) => ({ incidents: [...state.incidents, incident] })),
  updateIncident: (id, data) => set((state) => ({
    incidents: state.incidents.map((i) => (i.id === id ? { ...i, ...data } : i)),
  })),
  deleteIncident: (id) => set((state) => ({ incidents: state.incidents.filter((i) => i.id !== id) })),
}))
