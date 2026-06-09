import { create } from 'zustand'
import type { Shop, Contract, Bill, CollectionRecord } from '@/types'
import { shops as mockShops, contracts as mockContracts, bills as mockBills, collectionRecords as mockCollectionRecords } from '@/mock/shops'

interface ShopState {
  shops: Shop[]
  contracts: Contract[]
  bills: Bill[]
  collectionRecords: CollectionRecord[]
  addShop: (shop: Shop) => void
  updateShop: (id: string, data: Partial<Shop>) => void
  deleteShop: (id: string) => void
  addContract: (contract: Contract) => void
  updateContract: (id: string, data: Partial<Contract>) => void
  deleteContract: (id: string) => void
  addBill: (bill: Bill) => void
  updateBill: (id: string, data: Partial<Bill>) => void
  deleteBill: (id: string) => void
  addCollectionRecord: (record: CollectionRecord) => void
  updateCollectionRecord: (id: string, data: Partial<CollectionRecord>) => void
  deleteCollectionRecord: (id: string) => void
}

export const useShopStore = create<ShopState>((set) => ({
  shops: mockShops,
  contracts: mockContracts,
  bills: mockBills,
  collectionRecords: mockCollectionRecords,
  addShop: (shop) => set((state) => ({ shops: [...state.shops, shop] })),
  updateShop: (id, data) => set((state) => ({
    shops: state.shops.map((s) => (s.id === id ? { ...s, ...data } : s)),
  })),
  deleteShop: (id) => set((state) => ({ shops: state.shops.filter((s) => s.id !== id) })),
  addContract: (contract) => set((state) => ({ contracts: [...state.contracts, contract] })),
  updateContract: (id, data) => set((state) => ({
    contracts: state.contracts.map((c) => (c.id === id ? { ...c, ...data } : c)),
  })),
  deleteContract: (id) => set((state) => ({ contracts: state.contracts.filter((c) => c.id !== id) })),
  addBill: (bill) => set((state) => ({ bills: [...state.bills, bill] })),
  updateBill: (id, data) => set((state) => ({
    bills: state.bills.map((b) => (b.id === id ? { ...b, ...data } : b)),
  })),
  deleteBill: (id) => set((state) => ({ bills: state.bills.filter((b) => b.id !== id) })),
  addCollectionRecord: (record) => set((state) => ({ collectionRecords: [...state.collectionRecords, record] })),
  updateCollectionRecord: (id, data) => set((state) => ({
    collectionRecords: state.collectionRecords.map((r) => (r.id === id ? { ...r, ...data } : r)),
  })),
  deleteCollectionRecord: (id) => set((state) => ({ collectionRecords: state.collectionRecords.filter((r) => r.id !== id) })),
}))
