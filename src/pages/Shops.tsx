import { useState, useMemo } from 'react'
import {
  Search, Plus, Edit3, FileText, X, AlertTriangle,
  Check, PhoneCall, Save, ChevronDown, Building2,
  AlertCircle, Wallet, TrendingUp, CircleDot,
  RefreshCw, LogOut,
} from 'lucide-react'
import { useShopStore } from '@/stores/shopStore'
import { cn } from '@/lib/utils'
import type { Shop } from '@/types'

const FLOORS = ['1F', '2F', '3F', '4F', '5F', 'B1'] as const
const CATEGORIES = ['餐饮', '零售', '娱乐', '服务', '教育'] as const
const STATUSES = ['已出租', '空置', '即将到期', '装修中'] as const

const statusStyle: Record<string, string> = {
  已出租: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  空置: 'bg-white/8 text-white/50 border border-white/15',
  即将到期: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  装修中: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
}

const billStatusStyle: Record<string, string> = {
  已缴: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  未缴: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  逾期: 'bg-red-500/15 text-red-400 border border-red-500/30',
  部分缴纳: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
}

const versionLabel: Record<number, { text: string; style: string }> = {
  1: { text: '原合同', style: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  2: { text: '续租1', style: 'bg-purple-500/15 text-purple-400 border border-purple-500/30' },
  3: { text: '续租2', style: 'bg-pink-500/15 text-pink-400 border border-pink-500/30' },
}

function getVersionBadge(version?: number) {
  if (!version || version <= 1) return versionLabel[1]
  return versionLabel[Math.min(version, 3)]
}

interface FormData {
  number: string; area: string; rentPrice: string; floor: string;
  category: string; leaseStart: string; leaseEnd: string;
  tenantName: string; tenantPhone: string;
}

const emptyForm: FormData = {
  number: '', area: '', rentPrice: '', floor: '1F',
  category: '餐饮', leaseStart: '', leaseEnd: '',
  tenantName: '', tenantPhone: '',
}

interface RenewFormData {
  leaseStart: string
  leaseEnd: string
  rentPrice: string
}

export default function Shops() {
  const { shops, bills, collectionRecords, addShop, updateShop, updateBill, addCollectionRecord, generateBillsForShop, deleteBillsByShopId, renewShop, terminateShop } = useShopStore()

  const [floorFilter, setFloorFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingShop, setEditingShop] = useState<Shop | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)

  const [billsModalOpen, setBillsModalOpen] = useState(false)
  const [billsShop, setBillsShop] = useState<Shop | null>(null)

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; billId: string }>({ open: false, billId: '' })
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' })

  const [renewModalOpen, setRenewModalOpen] = useState(false)
  const [renewShopData, setRenewShopData] = useState<Shop | null>(null)
  const [renewForm, setRenewForm] = useState<RenewFormData>({ leaseStart: '', leaseEnd: '', rentPrice: '' })

  const [terminateDialog, setTerminateDialog] = useState<{ open: boolean; shopId: string }>({ open: false, shopId: '' })

  const filtered = useMemo(() => {
    return shops.filter((s) => {
      if (floorFilter && s.floor !== floorFilter) return false
      if (categoryFilter && s.category !== categoryFilter) return false
      if (statusFilter && s.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!s.number.toLowerCase().includes(q) && !s.tenantName.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [shops, floorFilter, categoryFilter, statusFilter, search])

  const stats = useMemo(() => {
    const rented = shops.filter((s) => s.status === '已出租').length
    const vacant = shops.filter((s) => s.status === '空置').length
    const expiring = shops.filter((s) => s.status === '即将到期').length
    const totalRent = shops.reduce((sum, s) => sum + s.area * s.rentPrice, 0)
    return { rented, vacant, expiring, totalRent }
  }, [shops])

  const shopBills = useMemo(() => {
    if (!billsShop) return []
    return bills.filter((b) => b.shopId === billsShop.id).sort((a, b) => {
      const va = a.contractVersion || 1
      const vb = b.contractVersion || 1
      if (va !== vb) return va - vb
      return a.billDate.localeCompare(b.billDate)
    })
  }, [bills, billsShop])

  const billCollectionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    collectionRecords.forEach((r) => {
      counts[r.billId] = (counts[r.billId] || 0) + 1
    })
    return counts
  }, [collectionRecords])

  const monthlyRent = form.area && form.rentPrice ? Number(form.area) * Number(form.rentPrice) : 0

  const showToast = (msg: string) => {
    setToast({ show: true, msg })
    setTimeout(() => setToast({ show: false, msg: '' }), 2500)
  }

  const openAddDrawer = () => {
    setEditingShop(null)
    setForm(emptyForm)
    setDrawerOpen(true)
  }

  const openEditDrawer = (shop: Shop) => {
    setEditingShop(shop)
    setForm({
      number: shop.number, area: String(shop.area), rentPrice: String(shop.rentPrice),
      floor: shop.floor, category: shop.category, leaseStart: shop.leaseStart,
      leaseEnd: shop.leaseEnd, tenantName: shop.tenantName, tenantPhone: shop.tenantPhone,
    })
    setDrawerOpen(true)
  }

  const handleSave = () => {
    const status: Shop['status'] = form.tenantName ? '已出租' : '空置'
    const shopData = {
      number: form.number, area: Number(form.area), rentPrice: Number(form.rentPrice),
      floor: form.floor, category: form.category, leaseStart: form.leaseStart,
      leaseEnd: form.leaseEnd, tenantName: form.tenantName, tenantPhone: form.tenantPhone, status,
    }
    if (editingShop) {
      updateShop(editingShop.id, shopData)
      const leaseChanged =
        editingShop.leaseStart !== form.leaseStart ||
        editingShop.leaseEnd !== form.leaseEnd ||
        editingShop.area !== Number(form.area) ||
        editingShop.rentPrice !== Number(form.rentPrice) ||
        editingShop.tenantName !== form.tenantName
      if (form.tenantName && form.leaseStart && form.leaseEnd) {
        if (leaseChanged) {
          generateBillsForShop({ ...editingShop, ...shopData })
        }
      } else if (!form.tenantName) {
        deleteBillsByShopId(editingShop.id)
      }
      showToast('商铺信息已更新')
    } else {
      const id = `S${String(shops.length + 1).padStart(3, '0')}`
      addShop({ id, ...shopData })
      if (form.tenantName && form.leaseStart && form.leaseEnd) {
        generateBillsForShop({ id, ...shopData })
      }
      showToast('商铺已新增')
    }
    setDrawerOpen(false)
  }

  const openBillsModal = (shop: Shop) => {
    setBillsShop(shop)
    setBillsModalOpen(true)
    const overdueBills = bills.filter((b) => b.shopId === shop.id && b.status === '逾期')
    overdueBills.forEach((bill, i) => {
      const hasRecord = collectionRecords.some((r) => r.billId === bill.id)
      if (!hasRecord) {
        addCollectionRecord({
          id: `CR${Date.now()}-${i}`,
          billId: bill.id,
          noticeDate: new Date().toISOString().slice(0, 10),
          type: '短信',
          status: '已通知',
        })
      }
    })
  }

  const handleConfirmPay = (billId: string) => {
    const bill = bills.find((b) => b.id === billId)
    if (bill) {
      updateBill(billId, { status: '已缴', paidDate: new Date().toISOString().slice(0, 10), paidAmount: bill.amount })
      showToast('缴费已确认')
    }
  }

  const handleCollection = (billId: string) => {
    setConfirmDialog({ open: true, billId })
  }

  const confirmCollection = () => {
    const id = `CR${String(collectionRecords.length + 1).padStart(3, '0')}`
    addCollectionRecord({
      id, billId: confirmDialog.billId,
      noticeDate: new Date().toISOString().slice(0, 10),
      type: '短信', status: '已通知',
    })
    setConfirmDialog({ open: false, billId: '' })
    showToast('催缴通知已发送')
  }

  const openRenewModal = (shop: Shop) => {
    setRenewShopData(shop)
    const newStart = shop.leaseEnd || new Date().toISOString().slice(0, 10)
    const endDate = shop.leaseEnd ? new Date(shop.leaseEnd) : new Date()
    endDate.setFullYear(endDate.getFullYear() + 1)
    const newEnd = endDate.toISOString().slice(0, 10)
    setRenewForm({
      leaseStart: newStart,
      leaseEnd: newEnd,
      rentPrice: String(shop.rentPrice),
    })
    setRenewModalOpen(true)
  }

  const handleRenew = () => {
    if (!renewShopData || !renewForm.leaseStart || !renewForm.leaseEnd || !renewForm.rentPrice) return
    renewShop(renewShopData.id, renewForm.leaseStart, renewForm.leaseEnd, Number(renewForm.rentPrice))
    setRenewModalOpen(false)
    setRenewShopData(null)
    showToast('续租成功，已生成续租账单')
  }

  const openTerminateDialog = (shopId: string) => {
    setTerminateDialog({ open: true, shopId })
  }

  const handleTerminate = () => {
    terminateShop(terminateDialog.shopId)
    setTerminateDialog({ open: false, shopId: '' })
    showToast('退租完成，商铺已释放')
  }

  const inputCls = 'w-full rounded-lg border border-white/10 bg-dark-700/50 px-3 py-2 text-sm text-white/90 placeholder-white/30 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20'
  const selectCls = inputCls + ' appearance-none'

  return (
    <div className="flex flex-col gap-5">
      {toast.show && (
        <div className="fixed right-6 top-20 z-[100] animate-slide-up rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-400 backdrop-blur-sm">
          <div className="flex items-center gap-2"><Check size={16} />{toast.msg}</div>
        </div>
      )}

      <div className="card-dark flex flex-wrap items-center gap-3 p-4">
        <div className="relative">
          <select value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)} className={selectCls + ' pr-8'}>
            <option value="">全部楼层</option>
            {FLOORS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40" />
        </div>
        <div className="relative">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={selectCls + ' pr-8'}>
            <option value="">全部业态</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls + ' pr-8'}>
            <option value="">全部状态</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40" />
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索编号/租户名称" className={inputCls + ' pl-9'} />
        </div>
        <button onClick={openAddDrawer} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-dark-900 transition-colors hover:bg-amber-400">
          <Plus size={16} />新增商铺
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '已出租数', value: stats.rented, icon: Building2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: '空置数', value: stats.vacant, icon: CircleDot, color: 'text-white/50', bg: 'bg-white/5' },
          { label: '即将到期', value: stats.expiring, icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: '月租金总收入', value: `¥${stats.totalRent.toLocaleString()}`, icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map((card) => (
          <div key={card.label} className="card-dark flex items-center gap-3 p-4">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', card.bg)}>
              <card.icon size={20} className={card.color} />
            </div>
            <div>
              <p className="text-xs text-white/40">{card.label}</p>
              <p className={cn('text-lg font-semibold', card.color)}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left text-white/50">
                <th className="px-4 py-3 font-medium">编号</th>
                <th className="px-4 py-3 font-medium">楼层</th>
                <th className="px-4 py-3 font-medium">业态</th>
                <th className="px-4 py-3 font-medium">面积(m²)</th>
                <th className="px-4 py-3 font-medium">租金单价</th>
                <th className="px-4 py-3 font-medium">租户</th>
                <th className="px-4 py-3 font-medium">租期起止</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((shop) => (
                <tr key={shop.id} className="border-b border-white/5 transition-colors hover:bg-white/4">
                  <td className="px-4 py-3 font-mono text-white/90">{shop.number}</td>
                  <td className="px-4 py-3 text-white/70">{shop.floor}</td>
                  <td className="px-4 py-3 text-white/70">{shop.category}</td>
                  <td className="px-4 py-3 font-mono text-white/70">{shop.area}</td>
                  <td className="px-4 py-3 font-mono text-white/70">¥{shop.rentPrice}</td>
                  <td className="px-4 py-3 text-white/70">{shop.tenantName || '-'}</td>
                  <td className="px-4 py-3 text-white/50">
                    {shop.leaseStart ? `${shop.leaseStart} ~ ${shop.leaseEnd}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', statusStyle[shop.status])}>
                      {shop.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button onClick={() => openEditDrawer(shop)} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-amber-400 transition-colors hover:bg-amber-500/10">
                        <Edit3 size={13} />编辑
                      </button>
                      <button onClick={() => openBillsModal(shop)} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-400 transition-colors hover:bg-blue-500/10">
                        <FileText size={13} />账单
                      </button>
                      {(shop.status === '即将到期' || shop.status === '已出租') && shop.tenantName && (
                        <button onClick={() => openRenewModal(shop)} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-purple-400 transition-colors hover:bg-purple-500/10">
                          <RefreshCw size={13} />续租
                        </button>
                      )}
                      {shop.tenantName && (
                        <button onClick={() => openTerminateDialog(shop.id)} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10">
                          <LogOut size={13} />退租
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-white/30">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={cn('fixed inset-0 z-50 flex justify-end transition-opacity duration-300', drawerOpen ? 'visible' : 'invisible pointer-events-none')}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
        <div className={cn('relative flex w-[420px] flex-col bg-dark-800 shadow-2xl transition-transform duration-300', drawerOpen ? 'translate-x-0' : 'translate-x-full')}>
          <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
            <h3 className="text-base font-semibold text-white">{editingShop ? '编辑商铺' : '新增商铺'}</h3>
            <button onClick={() => setDrawerOpen(false)} className="text-white/40 transition-colors hover:text-white"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-white/50">编号</label>
                <input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className={inputCls} placeholder="如 1F-A01" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-white/50">面积(m²)</label>
                  <input type="number" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className={inputCls} placeholder="0" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/50">租金单价(元/m²/月)</label>
                  <input type="number" value={form.rentPrice} onChange={(e) => setForm({ ...form, rentPrice: e.target.value })} className={inputCls} placeholder="0" />
                </div>
              </div>
              {monthlyRent > 0 && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-400">
                  月租金 = {form.area} × {form.rentPrice} = ¥{monthlyRent.toLocaleString()}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-white/50">楼层</label>
                  <div className="relative">
                    <select value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} className={selectCls + ' pr-8'}>
                      {FLOORS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/50">业态</label>
                  <div className="relative">
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={selectCls + ' pr-8'}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-white/50">租期起始</label>
                  <input type="date" value={form.leaseStart} onChange={(e) => setForm({ ...form, leaseStart: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/50">租期截止</label>
                  <input type="date" value={form.leaseEnd} onChange={(e) => setForm({ ...form, leaseEnd: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50">租户名称</label>
                <input value={form.tenantName} onChange={(e) => setForm({ ...form, tenantName: e.target.value })} className={inputCls} placeholder="留空则状态为空置" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50">联系电话</label>
                <input value={form.tenantPhone} onChange={(e) => setForm({ ...form, tenantPhone: e.target.value })} className={inputCls} placeholder="手机号码" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-white/8 px-6 py-4">
            <button onClick={handleSave} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-500 py-2.5 text-sm font-medium text-dark-900 transition-colors hover:bg-amber-400">
              <Save size={15} />保存
            </button>
            <button onClick={() => setDrawerOpen(false)} className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/5">取消</button>
          </div>
        </div>
      </div>

      {billsModalOpen && billsShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setBillsModalOpen(false)} />
          <div className="relative w-full max-w-2xl animate-fade-in rounded-xl border border-white/8 bg-dark-800 p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">{billsShop.number} - {billsShop.tenantName || '空置'} 账单列表</h3>
              <button onClick={() => setBillsModalOpen(false)} className="text-white/40 transition-colors hover:text-white"><X size={20} /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-left text-white/50">
                    <th className="px-3 py-2.5 font-medium">合同</th>
                    <th className="px-3 py-2.5 font-medium">账单月份</th>
                    <th className="px-3 py-2.5 font-medium">金额(元)</th>
                    <th className="px-3 py-2.5 font-medium">应缴日期</th>
                    <th className="px-3 py-2.5 font-medium">状态</th>
                    <th className="px-3 py-2.5 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {shopBills.map((bill) => {
                    const vBadge = getVersionBadge(bill.contractVersion)
                    return (
                      <tr key={bill.id} className="border-b border-white/5 transition-colors hover:bg-white/4">
                        <td className="px-3 py-2.5">
                          <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-medium', vBadge.style)}>
                            {vBadge.text}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-white/80">{bill.billDate}</td>
                        <td className="px-3 py-2.5 font-mono text-white/80">¥{bill.amount.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-white/60">{bill.dueDate}</td>
                        <td className="px-3 py-2.5">
                          <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', billStatusStyle[bill.status])}>
                            {bill.status}
                          </span>
                          {bill.status === '逾期' && billCollectionCounts[bill.id] > 0 && (
                            <span className="ml-1.5 text-xs text-red-300/60">({billCollectionCounts[bill.id]}条催缴)</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            {bill.status === '逾期' && (
                              <button onClick={() => handleCollection(bill.id)} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10">
                                <PhoneCall size={13} />催缴
                              </button>
                            )}
                            {(bill.status === '未缴' || bill.status === '逾期' || bill.status === '部分缴纳') && (
                              <button onClick={() => handleConfirmPay(bill.id)} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/10">
                                <Check size={13} />确认缴费
                              </button>
                            )}
                            {bill.status === '已缴' && <span className="text-xs text-white/30">已结清</span>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {shopBills.length === 0 && (
                    <tr><td colSpan={6} className="px-3 py-8 text-center text-white/30">暂无账单</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {renewModalOpen && renewShopData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRenewModalOpen(false)} />
          <div className="relative w-full max-w-md animate-fade-in rounded-xl border border-white/8 bg-dark-800 p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/15">
                <RefreshCw size={20} className="text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-white">续租申请</p>
                <p className="text-sm text-white/50">{renewShopData.number} - {renewShopData.tenantName}</p>
              </div>
            </div>
            <div className="space-y-4 mb-5">
              <div className="rounded-lg border border-white/8 bg-white/3 p-3 text-xs text-white/50">
                <div className="flex items-center justify-between mb-1">
                  <span>原租期</span>
                  <span className="text-white/70">{renewShopData.leaseStart} ~ {renewShopData.leaseEnd}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>原租金单价</span>
                  <span className="text-white/70">¥{renewShopData.rentPrice}/m²/月</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-white/50">新租期起始</label>
                  <input type="date" value={renewForm.leaseStart} onChange={(e) => setRenewForm({ ...renewForm, leaseStart: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/50">新租期截止</label>
                  <input type="date" value={renewForm.leaseEnd} onChange={(e) => setRenewForm({ ...renewForm, leaseEnd: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50">新租金单价(元/m²/月)</label>
                <input type="number" value={renewForm.rentPrice} onChange={(e) => setRenewForm({ ...renewForm, rentPrice: e.target.value })} className={inputCls} />
              </div>
              {renewForm.rentPrice && renewForm.leaseStart && renewForm.leaseEnd && (
                <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-sm text-purple-400">
                  续租月租金 = {renewShopData.area} × {renewForm.rentPrice} = ¥{(renewShopData.area * Number(renewForm.rentPrice)).toLocaleString()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleRenew} className="flex-1 rounded-lg bg-purple-500/80 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500">确认续租</button>
              <button onClick={() => setRenewModalOpen(false)} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-white/60 transition-colors hover:bg-white/5">取消</button>
            </div>
          </div>
        </div>
      )}

      {terminateDialog.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setTerminateDialog({ open: false, shopId: '' })} />
          <div className="relative w-full max-w-sm animate-fade-in rounded-xl border border-white/8 bg-dark-800 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
                <LogOut size={20} className="text-red-400" />
              </div>
              <div>
                <p className="font-medium text-white">确认退租</p>
                <p className="text-sm text-white/50">将结清未缴账单并释放商铺</p>
              </div>
            </div>
            {(() => {
              const unpaid = bills.filter((b) => b.shopId === terminateDialog.shopId && b.status !== '已缴')
              const totalUnpaid = unpaid.reduce((s, b) => s + b.amount, 0)
              return unpaid.length > 0 ? (
                <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                  <p className="text-xs text-red-400 mb-1">待结清账单: {unpaid.length}笔</p>
                  <p className="text-sm font-mono text-red-400">合计 ¥{totalUnpaid.toLocaleString()}</p>
                  <p className="text-[10px] text-white/30 mt-1">退租后将自动标记为已缴</p>
                </div>
              ) : (
                <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                  <p className="text-xs text-emerald-400">所有账单已结清</p>
                </div>
              )
            })()}
            <div className="flex items-center gap-3">
              <button onClick={handleTerminate} className="flex-1 rounded-lg bg-red-500/80 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500">确认退租</button>
              <button onClick={() => setTerminateDialog({ open: false, shopId: '' })} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-white/60 transition-colors hover:bg-white/5">取消</button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDialog({ open: false, billId: '' })} />
          <div className="relative w-full max-w-sm animate-fade-in rounded-xl border border-white/8 bg-dark-800 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <p className="font-medium text-white">确认催缴</p>
                <p className="text-sm text-white/50">将向租户发送催缴通知短信</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={confirmCollection} className="flex-1 rounded-lg bg-red-500/80 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500">确认催缴</button>
              <button onClick={() => setConfirmDialog({ open: false, billId: '' })} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-white/60 transition-colors hover:bg-white/5">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
