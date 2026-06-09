import { useState, useMemo } from 'react'
import {
  Search, Plus, Edit3, X, Save, ChevronDown, Check,
  TrendingUp, CircleDot, AlertCircle, Wrench,
  Bell, Trash2, Calendar,
} from 'lucide-react'
import { useAdvertisingStore } from '@/stores/advertisingStore'
import { cn } from '@/lib/utils'
import type { AdSpace } from '@/types'

const TYPES = ['LED大屏', '灯箱', '立牌', '吊旗', '电梯广告', '地贴'] as const
const STATUSES = ['已出租', '空置', '即将到期', '维护中'] as const

const statusStyle: Record<string, string> = {
  已出租: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  空置: 'bg-white/8 text-white/50 border border-white/15',
  即将到期: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  维护中: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
}

const typeColor: Record<string, string> = {
  LED大屏: 'bg-amber-500/80',
  灯箱: 'bg-blue-500/80',
  立牌: 'bg-emerald-500/80',
  吊旗: 'bg-purple-500/80',
  电梯广告: 'bg-cyan-500/80',
  地贴: 'bg-rose-500/80',
}

interface FormData {
  location: string
  type: AdSpace['type']
  size: string
  price: string
  leaseStart: string
  leaseEnd: string
  client: string
  contactPhone: string
}

const emptyForm: FormData = {
  location: '', type: 'LED大屏', size: '', price: '',
  leaseStart: '', leaseEnd: '', client: '', contactPhone: '',
}

export default function Advertising() {
  const { adSpaces, addAdSpace, updateAdSpace, deleteAdSpace } = useAdvertisingStore()

  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingAd, setEditingAd] = useState<AdSpace | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' })

  const filtered = useMemo(() => {
    return adSpaces.filter((a) => {
      if (typeFilter && a.type !== typeFilter) return false
      if (statusFilter && a.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!a.location.toLowerCase().includes(q) && !a.client.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [adSpaces, typeFilter, statusFilter, search])

  const stats = useMemo(() => {
    const rented = adSpaces.filter((a) => a.status === '已出租')
    const vacant = adSpaces.filter((a) => a.status === '空置')
    const expiring = adSpaces.filter((a) => a.status === '即将到期')
    const maintenance = adSpaces.filter((a) => a.status === '维护中')
    return {
      rented: { count: rented.length, revenue: rented.reduce((s, a) => s + a.price, 0) },
      vacant: { count: vacant.length, revenue: vacant.reduce((s, a) => s + a.price, 0) },
      expiring: { count: expiring.length, revenue: expiring.reduce((s, a) => s + a.price, 0) },
      maintenance: { count: maintenance.length, revenue: maintenance.reduce((s, a) => s + a.price, 0) },
    }
  }, [adSpaces])

  const leasedAds = useMemo(() => adSpaces.filter((a) => a.leaseStart && a.leaseEnd), [adSpaces])

  const ganttRange = useMemo(() => {
    if (leasedAds.length === 0) return null
    const times = leasedAds.flatMap((a) => [new Date(a.leaseStart).getTime(), new Date(a.leaseEnd).getTime()])
    const start = new Date(Math.min(...times))
    start.setMonth(start.getMonth() - 1)
    start.setDate(1)
    const end = new Date(Math.max(...times))
    end.setMonth(end.getMonth() + 1)
    end.setDate(1)
    return { start: start.getTime(), end: end.getTime() }
  }, [leasedAds])

  const ganttMonths = useMemo(() => {
    if (!ganttRange) return []
    const months: string[] = []
    const d = new Date(ganttRange.start)
    while (d.getTime() < ganttRange.end) {
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
      d.setMonth(d.getMonth() + 1)
    }
    return months
  }, [ganttRange])

  const expiryAds = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return adSpaces
      .filter((a) => a.leaseEnd && (a.status === '已出租' || a.status === '即将到期'))
      .map((a) => ({
        ...a,
        daysRemaining: Math.ceil((new Date(a.leaseEnd).getTime() - today.getTime()) / 86400000),
      }))
      .filter((a) => a.daysRemaining <= 30)
  }, [adSpaces])

  const leaseMonths = useMemo(() => {
    if (!form.leaseStart || !form.leaseEnd) return 0
    const s = new Date(form.leaseStart)
    const e = new Date(form.leaseEnd)
    return (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  }, [form.leaseStart, form.leaseEnd])

  const leaseCost = useMemo(() => {
    if (!form.price || leaseMonths <= 0) return 0
    return leaseMonths * Number(form.price)
  }, [form.price, leaseMonths])

  const todayMs = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }, [])

  const showToast = (msg: string) => {
    setToast({ show: true, msg })
    setTimeout(() => setToast({ show: false, msg: '' }), 2500)
  }

  const openAddDrawer = () => {
    setEditingAd(null)
    setForm(emptyForm)
    setDrawerOpen(true)
  }

  const openEditDrawer = (ad: AdSpace) => {
    setEditingAd(ad)
    setForm({
      location: ad.location, type: ad.type, size: ad.size, price: String(ad.price),
      leaseStart: ad.leaseStart, leaseEnd: ad.leaseEnd, client: ad.client, contactPhone: ad.contactPhone,
    })
    setDrawerOpen(true)
  }

  const handleSave = () => {
    const status: AdSpace['status'] = form.client ? '已出租' : '空置'
    if (editingAd) {
      updateAdSpace(editingAd.id, {
        location: form.location, type: form.type, size: form.size, price: Number(form.price),
        leaseStart: form.leaseStart, leaseEnd: form.leaseEnd, client: form.client,
        contactPhone: form.contactPhone, status,
      })
      showToast('广告位信息已更新')
    } else {
      const id = `AD${String(adSpaces.length + 1).padStart(3, '0')}`
      addAdSpace({
        id, location: form.location, type: form.type, size: form.size, price: Number(form.price),
        leaseStart: form.leaseStart, leaseEnd: form.leaseEnd, client: form.client,
        contactPhone: form.contactPhone, status,
      })
      showToast('广告位已新增')
    }
    setDrawerOpen(false)
  }

  const handleDelist = (id: string) => {
    deleteAdSpace(id)
    showToast('广告位已下架')
  }

  const handleNotify = (location: string) => {
    showToast(`已通知招商部: ${location} 即将到期`)
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
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectCls + ' pr-8'}>
            <option value="">全部类型</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
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
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索位置/客户" className={inputCls + ' pl-9'} />
        </div>
        <button onClick={openAddDrawer} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-dark-900 transition-colors hover:bg-amber-400">
          <Plus size={16} />新增广告位
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '已出租', ...stats.rented, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: '空置', ...stats.vacant, icon: CircleDot, color: 'text-white/50', bg: 'bg-white/5' },
          { label: '即将到期', ...stats.expiring, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: '维护中', ...stats.maintenance, icon: Wrench, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        ].map((card) => (
          <div key={card.label} className="card-dark flex items-center gap-3 p-4">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', card.bg)}>
              <card.icon size={20} className={card.color} />
            </div>
            <div>
              <p className="text-xs text-white/40">{card.label}</p>
              <p className={cn('text-lg font-semibold', card.color)}>{card.count}</p>
              <p className="text-xs text-white/30">月收 ¥{card.revenue.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left text-white/50">
                <th className="px-4 py-3 font-medium">位置</th>
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">尺寸</th>
                <th className="px-4 py-3 font-medium">单价(元/月)</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">租期</th>
                <th className="px-4 py-3 font-medium">客户</th>
                <th className="px-4 py-3 font-medium">联系电话</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ad) => {
                const isExpired = ad.leaseEnd && new Date(ad.leaseEnd).getTime() < todayMs
                const borderCls = isExpired
                  ? 'border-l-2 border-l-red-500'
                  : ad.status === '即将到期'
                    ? 'border-l-2 border-l-amber-500'
                    : ''
                return (
                  <tr key={ad.id} className={cn('border-b border-white/5 transition-colors hover:bg-white/4', borderCls)}>
                    <td className="px-4 py-3 text-white/90">{ad.location}</td>
                    <td className="px-4 py-3 text-white/70">{ad.type}</td>
                    <td className="px-4 py-3 font-mono text-white/70">{ad.size}</td>
                    <td className="px-4 py-3 font-mono text-white/70">¥{ad.price.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', statusStyle[ad.status])}>
                        {ad.status}
                      </span>
                      {isExpired && (
                        <span className="ml-1 inline-block rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400 border border-red-500/30">
                          已到期
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/50">
                      {ad.leaseStart ? `${ad.leaseStart} ~ ${ad.leaseEnd}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-white/70">{ad.client || '-'}</td>
                    <td className="px-4 py-3 text-white/50">{ad.contactPhone || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditDrawer(ad)} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-amber-400 transition-colors hover:bg-amber-500/10">
                          <Edit3 size={13} />编辑
                        </button>
                        <button onClick={() => handleDelist(ad.id)} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10">
                          <Trash2 size={13} />下架
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-white/30">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {ganttRange && leasedAds.length > 0 && (
        <div className="card-dark p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-white">租期排期</h3>
            </div>
            <div className="flex items-center gap-3">
              {Object.entries(typeColor).map(([t, c]) => (
                <div key={t} className="flex items-center gap-1.5">
                  <div className={cn('h-2 w-4 rounded-sm', c)} />
                  <span className="text-xs text-white/40">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="flex border-b border-white/8 pb-2">
                <div className="w-36 shrink-0" />
                <div className="flex flex-1">
                  {ganttMonths.map((m) => (
                    <div key={m} className="flex-1 text-center text-xs text-white/30">{m.slice(2)}</div>
                  ))}
                </div>
              </div>
              {leasedAds.map((ad) => {
                const sMs = new Date(ad.leaseStart).getTime()
                const eMs = new Date(ad.leaseEnd).getTime()
                const totalMs = ganttRange.end - ganttRange.start
                const left = ((sMs - ganttRange.start) / totalMs) * 100
                const width = ((eMs - sMs) / totalMs) * 100
                return (
                  <div key={ad.id} className="flex items-center py-1.5">
                    <div className="w-36 shrink-0 truncate pr-2 text-xs text-white/50">{ad.location}</div>
                    <div className="relative flex-1">
                      <div
                        className={cn('absolute h-6 cursor-pointer rounded-sm transition-all hover:ring-2 hover:ring-white/30', typeColor[ad.type])}
                        style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%` }}
                        onClick={() => openEditDrawer(ad)}
                        title={`${ad.location} | ${ad.client} | ${ad.leaseStart} ~ ${ad.leaseEnd}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {expiryAds.length > 0 && (
        <div className="card-dark p-4">
          <div className="mb-3 flex items-center gap-2">
            <Bell size={16} className="text-red-400" />
            <h3 className="text-sm font-semibold text-white">到期提醒</h3>
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-400">{expiryAds.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {expiryAds.map((ad) => (
              <div key={ad.id} className={cn('flex items-center justify-between rounded-lg border p-3', ad.daysRemaining < 0 ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5')}>
                <div>
                  <p className="text-sm text-white/90">{ad.location}</p>
                  <p className="text-xs text-white/40">{ad.type} | {ad.client || '-'}</p>
                  <p className={cn('text-xs', ad.daysRemaining < 0 ? 'text-red-400' : 'text-amber-400')}>
                    到期日: {ad.leaseEnd} | {ad.daysRemaining < 0 ? `已过期${Math.abs(ad.daysRemaining)}天` : `剩余${ad.daysRemaining}天`}
                  </p>
                </div>
                <button onClick={() => handleNotify(ad.location)} className="shrink-0 rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs text-amber-400 transition-colors hover:bg-amber-500/10">
                  通知招商部
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cn('fixed inset-0 z-50 flex justify-end transition-opacity duration-300', drawerOpen ? 'visible' : 'invisible pointer-events-none')}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
        <div className={cn('relative flex w-[420px] flex-col bg-dark-800 shadow-2xl transition-transform duration-300', drawerOpen ? 'translate-x-0' : 'translate-x-full')}>
          <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
            <h3 className="text-base font-semibold text-white">{editingAd ? '编辑广告位' : '新增广告位'}</h3>
            <button onClick={() => setDrawerOpen(false)} className="text-white/40 transition-colors hover:text-white"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-white/50">位置</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputCls} placeholder="如 1F中庭主屏" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-white/50">类型</label>
                  <div className="relative">
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AdSpace['type'] })} className={selectCls + ' pr-8'}>
                      {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/50">尺寸</label>
                  <input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className={inputCls} placeholder="如 8m×5m" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50">单价(元/月)</label>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} placeholder="0" />
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
              {leaseCost > 0 && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-400">
                  租赁费用 = ¥{Number(form.price).toLocaleString()} × {leaseMonths}月 = ¥{leaseCost.toLocaleString()}
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs text-white/50">客户名称</label>
                <input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} className={inputCls} placeholder="留空则状态为空置" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50">联系电话</label>
                <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className={inputCls} placeholder="手机号码" />
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
    </div>
  )
}
