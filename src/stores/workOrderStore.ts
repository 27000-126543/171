import { create } from 'zustand'
import type { WorkOrder } from '@/types'

interface WorkOrderState {
  workOrders: WorkOrder[]
  addWorkOrder: (order: WorkOrder) => void
  updateWorkOrder: (id: string, data: Partial<WorkOrder>) => void
  deleteWorkOrder: (id: string) => void
}

export const useWorkOrderStore = create<WorkOrderState>((set) => ({
  workOrders: [],
  addWorkOrder: (order) => set((state) => ({ workOrders: [...state.workOrders, order] })),
  updateWorkOrder: (id, data) => set((state) => ({
    workOrders: state.workOrders.map((o) => (o.id === id ? { ...o, ...data } : o)),
  })),
  deleteWorkOrder: (id) => set((state) => ({ workOrders: state.workOrders.filter((o) => o.id !== id) })),
}))
