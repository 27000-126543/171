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
  generateBillsForShop: (shop: Shop, contractVersion?: number) => Bill[]
  deleteBillsByShopId: (shopId: string) => void
  addCollectionRecord: (record: CollectionRecord) => void
  updateCollectionRecord: (id: string, data: Partial<CollectionRecord>) => void
  deleteCollectionRecord: (id: string) => void
  renewShop: (shopId: string, newLeaseStart: string, newLeaseEnd: string, newRentPrice: number) => void
  terminateShop: (shopId: string) => void
}

export const useShopStore = create<ShopState>((set, get) => ({
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
  generateBillsForShop: (shop, contractVersion = 1) => {
    if (!shop.tenantName || !shop.leaseStart || !shop.leaseEnd) return []

    const { bills: currentBills, contracts: currentContracts } = get()

    const existingBills = currentBills.filter((b) => b.shopId === shop.id)
    const paidBillMap = new Map<string, { paidDate: string; paidAmount: number }>()
    existingBills.forEach((b) => {
      if (b.status === '已缴') {
        const key = b.billDate.length > 7 ? b.billDate.substring(0, 7) : b.billDate
        paidBillMap.set(key, { paidDate: b.paidDate, paidAmount: b.paidAmount })
      }
    })

    const existingContract = currentContracts.find((c) => c.shopId === shop.id)
    const contractId = existingContract?.id || `CT${Date.now()}`

    const start = new Date(shop.leaseStart)
    const end = new Date(shop.leaseEnd)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const generatedBills: Bill[] = []
    let current = new Date(start.getFullYear(), start.getMonth(), 1)
    let i = 0

    while (current <= end) {
      const year = current.getFullYear()
      const month = current.getMonth()
      const billDate = `${year}-${String(month + 1).padStart(2, '0')}`
      const dueDate = `${year}-${String(month + 1).padStart(2, '0')}-10`
      const dueDateObj = new Date(year, month, 10)

      const paidInfo = paidBillMap.get(billDate)
      let status: Bill['status'] = '未缴'
      let paidDate = ''
      let paidAmount = 0

      if (paidInfo) {
        status = '已缴'
        paidDate = paidInfo.paidDate
        paidAmount = paidInfo.paidAmount
      } else if (dueDateObj < today) {
        status = '逾期'
      }

      generatedBills.push({
        id: `B${Date.now()}-${i}`,
        shopId: shop.id,
        contractId,
        amount: shop.area * shop.rentPrice,
        billDate,
        dueDate,
        status,
        paidDate,
        paidAmount,
        contractVersion,
      })

      i++
      current = new Date(year, month + 1, 1)
    }

    const newContract = existingContract
      ? null
      : {
          id: contractId,
          shopId: shop.id,
          tenantName: shop.tenantName,
          startDate: shop.leaseStart,
          endDate: shop.leaseEnd,
          monthlyRent: shop.area * shop.rentPrice,
          deposit: shop.area * shop.rentPrice * 2,
          status: '生效中' as const,
        }

    set((state) => ({
      bills: [...state.bills.filter((b) => b.shopId !== shop.id), ...generatedBills],
      contracts: newContract ? [...state.contracts, newContract] : state.contracts,
    }))

    return generatedBills
  },
  deleteBillsByShopId: (shopId) => set((state) => ({ bills: state.bills.filter((b) => b.shopId !== shopId) })),
  addCollectionRecord: (record) => set((state) => ({ collectionRecords: [...state.collectionRecords, record] })),
  updateCollectionRecord: (id, data) => set((state) => ({
    collectionRecords: state.collectionRecords.map((r) => (r.id === id ? { ...r, ...data } : r)),
  })),
  deleteCollectionRecord: (id) => set((state) => ({ collectionRecords: state.collectionRecords.filter((r) => r.id !== id) })),
  renewShop: (shopId, newLeaseStart, newLeaseEnd, newRentPrice) => {
    const { shops, bills, contracts } = get()
    const shop = shops.find((s) => s.id === shopId)
    if (!shop) return

    const maxVersion = bills
      .filter((b) => b.shopId === shopId)
      .reduce((max, b) => Math.max(max, b.contractVersion || 1), 0)
    const nextVersion = maxVersion + 1

    const updatedShop: Shop = {
      ...shop,
      leaseStart: newLeaseStart,
      leaseEnd: newLeaseEnd,
      rentPrice: newRentPrice,
      status: '已出租',
    }

    const renewedShop = { ...updatedShop, rentPrice: newRentPrice }

    const start = new Date(newLeaseStart)
    const end = new Date(newLeaseEnd)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existingContract = contracts.find((c) => c.shopId === shopId)
    const contractId = existingContract?.id || `CT${Date.now()}`

    const newBills: Bill[] = []
    let current = new Date(start.getFullYear(), start.getMonth(), 1)
    let i = 0
    while (current <= end) {
      const year = current.getFullYear()
      const month = current.getMonth()
      const billDate = `${year}-${String(month + 1).padStart(2, '0')}`
      const dueDate = `${year}-${String(month + 1).padStart(2, '0')}-10`
      const dueDateObj = new Date(year, month, 10)
      let status: Bill['status'] = '未缴'
      if (dueDateObj < today) status = '逾期'

      newBills.push({
        id: `B${Date.now()}-R${i}`,
        shopId,
        contractId,
        amount: shop.area * newRentPrice,
        billDate,
        dueDate,
        status,
        paidDate: '',
        paidAmount: 0,
        contractVersion: nextVersion,
      })
      i++
      current = new Date(year, month + 1, 1)
    }

    set((state) => ({
      shops: state.shops.map((s) => (s.id === shopId ? updatedShop : s)),
      bills: [...state.bills, ...newBills],
      contracts: existingContract
        ? state.contracts.map((c) => (c.id === existingContract.id ? {
            ...c,
            endDate: newLeaseEnd,
            monthlyRent: shop.area * newRentPrice,
            status: '生效中' as const,
          } : c))
        : [...state.contracts, {
            id: contractId,
            shopId,
            tenantName: shop.tenantName,
            startDate: newLeaseStart,
            endDate: newLeaseEnd,
            monthlyRent: shop.area * newRentPrice,
            deposit: shop.area * newRentPrice * 2,
            status: '生效中' as const,
          }],
    }))
  },
  terminateShop: (shopId) => {
    const { bills, shops } = get()
    const shop = shops.find((s) => s.id === shopId)
    if (!shop) return

    const unpaidBills = bills.filter((b) => b.shopId === shopId && b.status !== '已缴')

    set((state) => ({
      shops: state.shops.map((s) => (s.id === shopId ? {
        ...s,
        status: '空置' as const,
        tenantName: '',
        tenantPhone: '',
        leaseStart: '',
        leaseEnd: '',
      } : s)),
      bills: unpaidBills.length > 0
        ? state.bills.map((b) => (b.shopId === shopId && b.status !== '已缴' ? {
            ...b,
            status: '已缴' as const,
            paidDate: new Date().toISOString().slice(0, 10),
            paidAmount: b.amount,
          } : b))
        : state.bills,
      contracts: state.contracts.map((c) => (c.shopId === shopId ? {
        ...c,
        status: '已终止' as const,
      } : c)),
    }))
  },
}))
