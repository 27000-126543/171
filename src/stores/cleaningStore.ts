import { create } from 'zustand'
import type { CleaningTask, CleaningEscalation } from '@/types'
import { cleaningTasks as mockCleaningTasks } from '@/mock/cleaning'

interface CleaningState {
  tasks: CleaningTask[]
  escalations: CleaningEscalation[]
  addTask: (task: CleaningTask) => void
  updateTask: (id: string, data: Partial<CleaningTask>) => void
  deleteTask: (id: string) => void
  addEscalation: (escalation: CleaningEscalation) => void
}

export const useCleaningStore = create<CleaningState>((set) => ({
  tasks: mockCleaningTasks,
  escalations: [],
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, data) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
  })),
  deleteTask: (id) => set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
  addEscalation: (escalation) => set((state) => ({
    escalations: [...state.escalations, escalation],
  })),
}))
