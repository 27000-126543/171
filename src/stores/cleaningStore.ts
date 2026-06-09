import { create } from 'zustand'
import type { CleaningTask } from '@/types'
import { cleaningTasks as mockCleaningTasks } from '@/mock/cleaning'

interface CleaningState {
  tasks: CleaningTask[]
  addTask: (task: CleaningTask) => void
  updateTask: (id: string, data: Partial<CleaningTask>) => void
  deleteTask: (id: string) => void
}

export const useCleaningStore = create<CleaningState>((set) => ({
  tasks: mockCleaningTasks,
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, data) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
  })),
  deleteTask: (id) => set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
}))
