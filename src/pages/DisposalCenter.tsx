import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Receipt, Car, Building2, Sparkles, ShieldAlert,
  Check, X, Clock, ChevronDown, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { useWorkOrderStore } from '@/stores/workOrderStore'
import { useShopStore } from '@/stores/shopStore'
import { useParkingStore } from '@/stores/parkingStore'
import { useAdvertisingStore } from '@/stores/advertisingStore'
import { useCleaningStore } from '@/stores/cleaningStore'
import { useSecurityStore } from '@/stores/securityStore'
import { cn } from '@/lib/utils'
import type { WorkOrder } from '@/types'

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  '逾期账单': { icon: <Receipt className="w-4 h-4" />, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  '超时车辆': { icon: <Car className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  '过期广告': { icon: <Building2 className="w-4 h-4" />, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  '超时清洁': { icon: <Sparkles className="w-4 h-4" />, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  '安保事件': { icon: <ShieldAlert className="w-4 h-4" />, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
}

const STATUS_STYLE: Record<string, string> = {
  '待处理': 'bg-red-500/15 text-red-400 border border-red-500/30',
  '处理中': 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  '已处理': 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
}

export default function DisposalCenter() {
  const [searchParams] = useSearchParams()
  const typeParam = searchParams.get('type') || ''

  const { workOrders, addWorkOrder, updateWorkOrder } = useWorkOrderStore()
  const { bills, shops: storeShops, updateBill } = useShopStore()
  const { parkingSpots, reminders, addReminder } = useParkingStore()
  const { adSpaces, updateAdSpace } = useAdvertisingStore()
  const { tasks: cleaningTasks, updateTask: updateCleaningTask } = useCleaningStore()
  const { incidents, updateIncident } = useSecurityStore()

  const [typeFilter, setTypeFilter] = useState(typeParam)
  const [statusFilter, setStatusFilter] = useState('')
  const [handleModal, setHandleModal] = useState<{ open: boolean; orderId: string }>({ open: false, orderId: '' })
  const [handleForm, setHandleForm] = useState({ handler: '', result: '' })

  useEffect(() => {
    if (typeParam) setTypeFilter(typeParam)
  }, [typeParam])

  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')

  const remindSpotIds = useMemo(() => new Set(reminders.map((r) => r.spotId)), [reminders])

  const overdueBills = useMemo(() => bills.filter((b) => b.status === '逾期'), [bills])
  const overtimeVehicles = useMemo(() => {
    const currentTime = Date.now()
    return parkingSpots.filter((s) => {
      if (s.status !== '占用' || !s.enterTime) return false
      if (remindSpotIds.has(s.id)) return false
      const hours = (currentTime - new Date(s.enterTime).getTime()) / 3600000
      return hours > 4
    })
  }, [parkingSpots, remindSpotIds])
  const expiredAds = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return adSpaces.filter((a) => a.leaseEnd && new Date(a.leaseEnd).getTime() < today.getTime() && (a.status === '已出租' || a.status === '即将到期'))
  }, [adSpaces])
  const overdueCleaning = useMemo(() => cleaningTasks.filter((t) => t.status === '超时'), [cleaningTasks])
  const pendingIncidents = useMemo(() => incidents.filter((e) => e.status === '待处置' || e.status === '处置中'), [incidents])

  const existingOrderSourceIds = useMemo(() => new Set(workOrders.map((o) => o.sourceId)), [workOrders])

  useEffect(() => {
    const newOrders: Array<{ type: WorkOrder['type']; sourceId: string; title: string; description: string }> = []

    overdueBills.forEach((b) => {
      const sid = `bill-${b.id}`
      if (!existingOrderSourceIds.has(sid)) {
        const shop = storeShops.find((s) => s.id === b.shopId)
        newOrders.push({ type: '逾期账单', sourceId: sid, title: `逾期账单 ${shop?.number || b.shopId}`, description: `${shop?.number || b.shopId} 逾期 ¥${b.amount.toLocaleString()}，应缴日 ${b.dueDate}` })
      }
    })
    overtimeVehicles.forEach((s) => {
      const sid = `parking-${s.id}`
      if (!existingOrderSourceIds.has(sid)) {
        const hours = ((Date.now() - new Date(s.enterTime).getTime()) / 3600000).toFixed(1)
        newOrders.push({ type: '超时车辆', sourceId: sid, title: `超时车辆 ${s.vehiclePlate}`, description: `${s.vehiclePlate} 停放 ${hours}小时（${s.floor}）` })
      }
    })
    expiredAds.forEach((a) => {
      const sid = `ad-${a.id}`
      if (!existingOrderSourceIds.has(sid)) {
        newOrders.push({ type: '过期广告', sourceId: sid, title: `过期广告 ${a.location}`, description: `${a.location}（${a.type}）租期 ${a.leaseEnd} 已过期` })
      }
    })
    overdueCleaning.forEach((t) => {
      const sid = `cleaning-${t.id}`
      if (!existingOrderSourceIds.has(sid)) {
        newOrders.push({ type: '超时清洁', sourceId: sid, title: `超时清洁 ${t.area}`, description: `${t.area}（${t.floor}）${t.level}级清洁超时，负责人 ${t.assignee || '未分配'}` })
      }
    })
    pendingIncidents.forEach((e) => {
      const sid = `incident-${e.id}`
      if (!existingOrderSourceIds.has(sid)) {
        newOrders.push({ type: '安保事件', sourceId: sid, title: `${e.type} ${e.location}`, description: `${e.type}事件 ${e.location} - ${e.description}` })
      }
    })

    newOrders.forEach((item, i) => {
      addWorkOrder({
        id: `WO${Date.now()}-${i}`,
        type: item.type,
        sourceId: item.sourceId,
        title: item.title,
        description: item.description,
        status: '待处理',
        createdAt: now,
        handler: '',
        handledAt: '',
        result: '',
      })
    })
  }, [overdueBills, overtimeVehicles, expiredAds, overdueCleaning, pendingIncidents, existingOrderSourceIds])

  const filtered = useMemo(() => {
    return workOrders.filter((o) => {
      if (typeFilter && o.type !== typeFilter) return false
      if (statusFilter && o.status !== statusFilter) return false
      return true
    }).sort((a, b) => {
      if (a.status === '已处理' && b.status !== '已处理') return 1
      if (a.status !== '已处理' && b.status === '已处理') return -1
      return b.createdAt.localeCompare(a.createdAt)
    })
  }, [workOrders, typeFilter, statusFilter])

  const stats = useMemo(() => ({
    pending: workOrders.filter((o) => o.status === '待处理').length,
    processing: workOrders.filter((o) => o.status === '处理中').length,
    done: workOrders.filter((o) => o.status === '已处理').length,
  }), [workOrders])

  const handleStartProcess = (orderId: string) => {
    updateWorkOrder(orderId, { status: '处理中' })
  }

  const openHandleModal = (orderId: string) => {
    setHandleForm({ handler: '', result: '' })
    setHandleModal({ open: true, orderId })
  }

  const resolveSourceData = (order: WorkOrder) => {
    const { sourceId, type } = order
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ')

    if (type === '逾期账单' && sourceId.startsWith('bill-')) {
      const billId = sourceId.replace('bill-', '')
      const bill = bills.find((b) => b.id === billId)
      if (bill && bill.status !== '已缴') {
        updateBill(billId, { status: '已缴', paidDate: new Date().toISOString().slice(0, 10), paidAmount: bill.amount })
      }
    }

    if (type === '过期广告' && sourceId.startsWith('ad-')) {
      const adId = sourceId.replace('ad-', '')
      const ad = adSpaces.find((a) => a.id === adId)
      if (ad && ad.status !== '空置') {
        updateAdSpace(adId, { status: '空置' })
      }
    }

    if (type === '超时清洁' && sourceId.startsWith('cleaning-')) {
      const taskId = sourceId.replace('cleaning-', '')
      const task = cleaningTasks.find((t) => t.id === taskId)
      if (task && task.status !== '已完成') {
        updateCleaningTask(taskId, { status: '已完成', completedAt: nowStr })
      }
    }

    if (type === '安保事件' && sourceId.startsWith('incident-')) {
      const incidentId = sourceId.replace('incident-', '')
      const incident = incidents.find((e) => e.id === incidentId)
      if (incident && incident.status !== '已处置' && incident.status !== '已归档') {
        updateIncident(incidentId, { status: '已处置', resolvedAt: nowStr, resolution: '处置中心处理' })
      }
    }

    if (type === '超时车辆' && sourceId.startsWith('parking-')) {
      const spotId = sourceId.replace('parking-', '')
      const alreadyReminded = reminders.some((r) => r.spotId === spotId)
      if (!alreadyReminded) {
        const spot = parkingSpots.find((s) => s.id === spotId)
        if (spot) {
          addReminder({
            id: `PR${Date.now()}`,
            spotId: spot.id,
            vehiclePlate: spot.vehiclePlate,
            reminderTime: nowStr,
            fee: Math.ceil(((Date.now() - new Date(spot.enterTime).getTime()) / 3600000)) * 5,
            status: '已发送',
          })
        }
      }
    }
  }

  const confirmHandle = () => {
    if (!handleForm.handler || !handleForm.result) return
    const order = workOrders.find((o) => o.id === handleModal.orderId)
    if (order) resolveSourceData(order)
    updateWorkOrder(handleModal.orderId, {
      status: '已处理',
      handler: handleForm.handler,
      handledAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      result: handleForm.result,
    })
    setHandleModal({ open: false, orderId: '' })
  }

  const handleSendReminder = (orderId: string) => {
    const order = workOrders.find((o) => o.id === orderId)
    if (!order || !order.sourceId.startsWith('parking-')) return
    const spotId = order.sourceId.replace('parking-', '')
    const spot = parkingSpots.find((s) => s.id === spotId)
    if (!spot) return
    addReminder({
      id: `PR${Date.now()}`,
      spotId: spot.id,
      vehiclePlate: spot.vehiclePlate,
      reminderTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
      fee: Math.ceil(((Date.now() - new Date(spot.enterTime).getTime()) / 3600000)) * 5,
      status: '已发送',
    })
    updateWorkOrder(orderId, {
      status: '已处理',
      handler: '系统',
      handledAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      result: '已发送缴费提醒',
    })
  }

  const selectCls = 'rounded-lg border border-white/10 bg-dark-700/50 px-3 py-2 text-sm text-white/90 outline-none transition-colors focus:border-amber-500/50 appearance-none pr-8'

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '待处理', value: stats.pending, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: '处理中', value: stats.processing, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: '已处理', value: stats.done, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
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

      <div className="card-dark flex flex-wrap items-center gap-3 p-4">
        <div className="relative">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectCls}>
            <option value="">全部类型</option>
            {Object.keys(TYPE_CONFIG).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls}>
            <option value="">全部状态</option>
            <option value="待处理">待处理</option>
            <option value="处理中">处理中</option>
            <option value="已处理">已处理</option>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40" />
        </div>
        <div className="flex-1" />
        <span className="text-xs text-white/30">共 {filtered.length} 条工单</span>
      </div>

      <div className="card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left text-white/50">
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">工单标题</th>
                <th className="px-4 py-3 font-medium">描述</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">创建时间</th>
                <th className="px-4 py-3 font-medium">处理人</th>
                <th className="px-4 py-3 font-medium">处理结果</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const cfg = TYPE_CONFIG[order.type] || TYPE_CONFIG['安保事件']
                return (
                  <tr key={order.id} className="border-b border-white/5 transition-colors hover:bg-white/4">
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.bg, cfg.color)}>
                        {cfg.icon}{order.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/90 font-medium">{order.title}</td>
                    <td className="px-4 py-3 text-white/60 max-w-[240px] truncate">{order.description}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_STYLE[order.status])}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs font-mono">{order.createdAt}</td>
                    <td className="px-4 py-3 text-white/70">{order.handler || '-'}</td>
                    <td className="px-4 py-3 text-white/60 max-w-[160px] truncate">{order.result || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {order.status === '待处理' && (
                          <>
                            <button onClick={() => handleStartProcess(order.id)} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-amber-400 transition-colors hover:bg-amber-500/10">
                              <Clock size={13} />开始处理
                            </button>
                            {order.sourceId.startsWith('parking-') && (
                              <button onClick={() => handleSendReminder(order.id)} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-400 transition-colors hover:bg-blue-500/10">
                                <Car size={13} />发提醒
                              </button>
                            )}
                          </>
                        )}
                        {order.status === '处理中' && (
                          <button onClick={() => openHandleModal(order.id)} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/10">
                            <Check size={13} />完成
                          </button>
                        )}
                        {order.status === '已处理' && (
                          <span className="text-xs text-white/30">已完成</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-white/30">暂无工单</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {handleModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setHandleModal({ open: false, orderId: '' })} />
          <div className="relative w-full max-w-md animate-fade-in rounded-xl border border-white/8 bg-dark-800 p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 size={20} className="text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-white">完成处置</p>
                <p className="text-sm text-white/50">填写处理人和处理结果</p>
              </div>
            </div>
            <div className="space-y-4 mb-5">
              <div>
                <label className="mb-1 block text-xs text-white/50">处理人</label>
                <input value={handleForm.handler} onChange={(e) => setHandleForm({ ...handleForm, handler: e.target.value })} className="w-full rounded-lg border border-white/10 bg-dark-700/50 px-3 py-2 text-sm text-white/90 outline-none focus:border-amber-500/50" placeholder="输入处理人姓名" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50">处理结果</label>
                <textarea value={handleForm.result} onChange={(e) => setHandleForm({ ...handleForm, result: e.target.value })} className="w-full rounded-lg border border-white/10 bg-dark-700/50 px-3 py-2 text-sm text-white/90 outline-none focus:border-amber-500/50 resize-none" rows={3} placeholder="描述处理结果" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={confirmHandle} className="flex-1 rounded-lg bg-emerald-500/80 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500">确认完成</button>
              <button onClick={() => setHandleModal({ open: false, orderId: '' })} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-white/60 transition-colors hover:bg-white/5">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
