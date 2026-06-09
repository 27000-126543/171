import { create } from 'zustand'
import type { OperationPlan } from '@/types'
import { operationPlans as mockOperationPlans } from '@/mock/shops'

interface OperationState {
  plans: OperationPlan[]
  addPlan: (plan: OperationPlan) => void
  updatePlan: (id: string, data: Partial<OperationPlan>) => void
  deletePlan: (id: string) => void
}

export const useOperationStore = create<OperationState>((set) => ({
  plans: mockOperationPlans,
  addPlan: (plan) => set((state) => ({ plans: [...state.plans, plan] })),
  updatePlan: (id, data) => set((state) => ({
    plans: state.plans.map((p) => (p.id === id ? { ...p, ...data } : p)),
  })),
  deletePlan: (id) => set((state) => ({ plans: state.plans.filter((p) => p.id !== id) })),
}))
