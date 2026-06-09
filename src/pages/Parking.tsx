import { useState, useMemo } from 'react'
import {
  Car,
  Star,
  Clock,
  Send,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Check,
  Ban,
  AlertTriangle,
  LogIn,
  LogOut,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useParkingStore } from '@/stores/parkingStore'
import type { ParkingReminder } from '@/types'

const FLOORS = ['B1', 'B2', 'B3'] as const
const TOTAL_SPOTS_PER_FLOOR: Record<string, number> = { B1: 50, B2: 60, B3: 45 }

function getOccupancyColor(rate: number) {
  if (rate < 70) return { stroke: '#10B981', text: 'text-emerald-400', label: '通畅' }
  if (rate <= 90) return { stroke: '#F0A500', text: 'text-amber-400', label: '较满' }
  return { stroke: '#EF4444', text: 'text-red-400', label: '拥挤' }
}

function calcFee(enterTime: string): number {
  const enter = new Date(enterTime.replace(' ', 'T'))
  const now = new Date('2025-06-09T14:00')
  const hours = (now.getTime() - enter.getTime()) / (1000 * 60 * 60)
  if (hours <= 2) return 0
  return Math.ceil(hours - 2) * 5
}

function formatDuration(enterTime: string): string {
  const enter = new Date(enterTime.replace(' ', 'T'))
  const now = new Date('2025-06-09T14:00')
  const diffMs = now.getTime() - enter.getTime()
  const h = Math.floor(diffMs / (1000 * 60 * 60))
  const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  return `${h}小时${m}分钟`
}

const statusConfig: Record<string, { bg: string; border: string; label: string }> = {
  '空闲': { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', label: '空' },
  '占用': { bg: 'bg-red-500/20', border: 'border-red-500/40', label: '占' },
  '预留': { bg: 'bg-amber-500/20', border: 'border-amber-500/40', label: '预' },
  '维护中': { bg: 'bg-gray-500/20', border: 'border-gray-500/40', label: '维' },
}

const statusDot: Record<string, string> = {
  '空闲': 'bg-emerald-400',
  '占用': 'bg-red-400',
  '预留': 'bg-amber-400',
  '维护中': 'bg-gray-400',
}

interface SpotDetailProps {
  spot: { vehiclePlate: string; enterTime: string; number: string; status: string; isVip: boolean }
  onClose: () => void
}

function SpotDetail({ spot, onClose }: SpotDetailProps) {
  const fee = spot.status === '占用' && spot.enterTime ? calcFee(spot.enterTime) : 0
  return (
    <div className="card-dark p-4 animate-fade-in">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">车位详情</h4>
        <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-white/50">车位号</span>
          <span className="font-mono text-white">{spot.number}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">状态</span>
          <span className={cn('font-medium', spot.status === '占用' ? 'text-red-400' : 'text-white')}>{spot.status}</span>
        </div>
        {spot.isVip && (
          <div className="flex justify-between">
            <span className="text-white/50">类型</span>
            <span className="flex items-center gap-1 text-amber-400"><Star size={12} /> VIP</span>
          </div>
        )}
        {spot.vehiclePlate && (
          <div className="flex justify-between">
            <span className="text-white/50">车牌号</span>
            <span className="font-mono text-white">{spot.vehiclePlate}</span>
          </div>
        )}
        {spot.enterTime && (
          <>
            <div className="flex justify-between">
              <span className="text-white/50">入场时间</span>
              <span className="text-white">{spot.enterTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">停放时长</span>
              <span className="text-white">{formatDuration(spot.enterTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">应收费用</span>
              <span className={cn('font-semibold', fee > 0 ? 'text-amber-400' : 'text-emerald-400')}>
                {fee > 0 ? `¥${fee}` : '免费'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

interface NewReservationForm {
  applicant: string
  phone: string
  reserveDate: string
  reserveTime: string
  duration: number
}

export default function Parking() {
  const { parkingSpots, vipReservations, addVipReservation, updateVipReservation, reminders, addReminder } = useParkingStore()
  const [activeFloor, setActiveFloor] = useState<string>('B1')
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null)
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null)
  const [showNewReservation, setShowNewReservation] = useState(false)
  const [entryExpanded, setEntryExpanded] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' })
  const [newRes, setNewRes] = useState<NewReservationForm>({
    applicant: '',
    phone: '',
    reserveDate: '',
    reserveTime: '',
    duration: 2,
  })

  const floorStats = useMemo(() => {
    return FLOORS.map((floor) => {
      const spots = parkingSpots.filter((s) => s.floor === floor)
      const total = TOTAL_SPOTS_PER_FLOOR[floor]
      const occupied = spots.filter((s) => s.status === '占用').length
      const available = spots.filter((s) => s.status === '空闲').length
      const rate = Math.round((occupied / total) * 100)
      return { floor, total, occupied, available, rate }
    })
  }, [parkingSpots])

  const overtimeVehicles = useMemo(() => {
    return parkingSpots
      .filter((s) => s.status === '占用' && s.enterTime)
      .map((s) => ({ ...s, fee: calcFee(s.enterTime), duration: formatDuration(s.enterTime) }))
      .filter((v) => v.fee > 0)
      .sort((a, b) => b.fee - a.fee)
  }, [parkingSpots])

  const currentFloorSpots = useMemo(() => {
    return parkingSpots.filter((s) => s.floor === activeFloor)
  }, [parkingSpots, activeFloor])

  const selectedSpot = useMemo(() => {
    if (!selectedSpotId) return null
    return parkingSpots.find((s) => s.id === selectedSpotId) || null
  }, [parkingSpots, selectedSpotId])

  const entryExitRecords = useMemo(() => {
    const entries = parkingSpots
      .filter((s) => s.status === '占用' && s.enterTime)
      .map((s) => ({
        plate: s.vehiclePlate,
        floor: s.floor,
        time: s.enterTime,
        type: '入场' as const,
      }))
    const exits: { plate: string; floor: string; time: string; type: '出场' }[] = [
      { plate: '沪G·11223', floor: 'B1', time: '2025-06-09 13:45', type: '出场' },
      { plate: '沪H·44556', floor: 'B2', time: '2025-06-09 12:30', type: '出场' },
    ]
    return [...entries, ...exits].sort((a, b) => b.time.localeCompare(a.time))
  }, [parkingSpots, reminders])

  const pendingReservations = vipReservations.filter((r) => r.status === '待审批')

  function CircularProgress({ rate, color, size = 80 }: { rate: number; color: string; size?: number }) {
    const r = (size - 8) / 2
    const c = 2 * Math.PI * r
    const offset = c - (rate / 100) * c
    return (
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
    )
  }

  function handleApprove(id: string) {
    updateVipReservation(id, { status: '已批准' })
  }

  function handleReject(id: string) {
    updateVipReservation(id, { status: '已拒绝' })
  }

  function handleAddReservation() {
    if (!newRes.applicant || !newRes.phone || !newRes.reserveDate || !newRes.reserveTime) return
    addVipReservation({
      id: `VR${Date.now()}`,
      parkingId: '',
      applicant: newRes.applicant,
      phone: newRes.phone,
      reserveDate: newRes.reserveDate,
      reserveTime: newRes.reserveTime,
      duration: newRes.duration,
      status: '待审批',
    })
    setNewRes({ applicant: '', phone: '', reserveDate: '', reserveTime: '', duration: 2 })
    setShowNewReservation(false)
  }

  function getLatestReminder(spotId: string): ParkingReminder | undefined {
    return reminders
      .filter((r) => r.spotId === spotId)
      .sort((a, b) => b.reminderTime.localeCompare(a.reminderTime))[0]
  }

  function handleSendReminder(spotId: string, vehiclePlate: string, fee: number) {
    const now = new Date('2025-06-09T14:00')
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const reminder: ParkingReminder = {
      id: `PR${Date.now()}`,
      spotId,
      vehiclePlate,
      reminderTime: timeStr,
      fee,
      status: '已发送',
    }
    addReminder(reminder)
    setToast({ show: true, msg: `缴费提醒已发送至 ${vehiclePlate}` })
    setTimeout(() => setToast({ show: false, msg: '' }), 3000)
  }

  return (
    <div className="space-y-6">
      {toast.show && (
        <div className="fixed right-6 top-20 z-[100] animate-slide-up rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-400 backdrop-blur-sm">
          <div className="flex items-center gap-2"><Check size={16} />{toast.msg}</div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
          <Car size={22} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">停车场管理</h1>
          <p className="text-sm text-white/40">实时车位监控与VIP预约管理</p>
        </div>
      </div>

      {/* 楼层概览卡片 */}
      <div className="grid grid-cols-3 gap-4">
        {floorStats.map((stat) => {
          const colorInfo = getOccupancyColor(stat.rate)
          return (
            <div
              key={stat.floor}
              className={cn('card-dark p-5 transition-all duration-300 hover:border-white/12', activeFloor === stat.floor && 'ring-1 ring-amber-500/30')}
              onClick={() => setActiveFloor(stat.floor)}
              role="button"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{stat.floor}</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', colorInfo.text, 'bg-white/5')}>
                      {colorInfo.label}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-white/40">总车位</span>
                      <span className="font-mono text-white">{stat.total}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white/40">已占用</span>
                      <span className="font-mono text-red-400">{stat.occupied}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white/40">空闲</span>
                      <span className="font-mono text-emerald-400">{stat.available}</span>
                    </div>
                  </div>
                </div>
                <div className="relative flex items-center justify-center">
                  <CircularProgress rate={stat.rate} color={colorInfo.stroke} size={80} />
                  <div className="absolute flex flex-col items-center">
                    <span className={cn('text-lg font-bold', colorInfo.text)}>{stat.rate}%</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 楼层Tab + 车位网格 + 超时计费面板 */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 space-y-4">
          {/* 楼层Tab */}
          <div className="flex items-center gap-2">
            {FLOORS.map((floor) => (
              <button
                key={floor}
                onClick={() => setActiveFloor(floor)}
                className={cn(
                  'rounded-lg px-5 py-2 text-sm font-medium transition-all duration-200',
                  activeFloor === floor
                    ? 'bg-amber-500 text-dark-900 shadow-lg shadow-amber-500/20'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                )}
              >
                {floor} 层
              </button>
            ))}
          </div>

          {/* 车位网格 */}
          <div className="card-dark p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{activeFloor} 层车位分布</h3>
              <div className="flex items-center gap-4 text-xs text-white/50">
                {Object.keys(statusConfig).map((key) => (
                  <span key={key} className="flex items-center gap-1.5">
                    <span className={cn('h-2.5 w-2.5 rounded-sm', statusDot[key])} />
                    {key}
                  </span>
                ))}
                <span className="flex items-center gap-1.5">
                  <Star size={10} className="text-amber-400" />
                  VIP
                </span>
              </div>
            </div>
            <div className="grid grid-cols-8 gap-2.5">
              {currentFloorSpots.map((spot) => {
                const cfg = statusConfig[spot.status]
                const isHovered = hoveredSpotId === spot.id
                const isSelected = selectedSpotId === spot.id
                return (
                  <div
                    key={spot.id}
                    className={cn(
                      'relative flex h-14 cursor-pointer flex-col items-center justify-center rounded-lg border transition-all duration-200',
                      cfg.bg,
                      cfg.border,
                      isHovered && 'scale-110 shadow-lg z-10',
                      isSelected && 'ring-2 ring-amber-400/60'
                    )}
                    onMouseEnter={() => setHoveredSpotId(spot.id)}
                    onMouseLeave={() => setHoveredSpotId(null)}
                    onClick={() => {
                      if (spot.status === '占用' || spot.status === '预留') {
                        setSelectedSpotId(isSelected ? null : spot.id)
                      }
                    }}
                  >
                    {spot.isVip && <Star size={10} className="absolute right-1 top-1 text-amber-400" />}
                    <span className="text-[10px] font-mono font-medium text-white/80">
                      {spot.number.replace(`${activeFloor}-`, '')}
                    </span>
                    <span className={cn('mt-0.5 text-[9px] font-medium', statusDot[spot.status].replace('bg-', 'text-').replace('-400', '-300'))}>
                      {cfg.label}
                    </span>
                    {isHovered && spot.vehiclePlate && (
                      <div className="absolute -top-14 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-dark-700 px-3 py-2 shadow-xl animate-fade-in whitespace-nowrap">
                        <p className="text-xs font-mono font-medium text-white">{spot.vehiclePlate}</p>
                        {spot.enterTime && <p className="text-[10px] text-white/50">{spot.enterTime}</p>}
                        <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-dark-700" />
                      </div>
                    )}
                  </div>
                )
              })}
              {Array.from({ length: TOTAL_SPOTS_PER_FLOOR[activeFloor] - currentFloorSpots.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex h-14 items-center justify-center rounded-lg border border-white/5 bg-white/3"
                >
                  <span className="text-[10px] font-mono text-white/20">
                    {String(currentFloorSpots.length + i + 1).padStart(3, '0')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 车位详情弹窗 */}
          {selectedSpot && (
            <SpotDetail spot={selectedSpot} onClose={() => setSelectedSpotId(null)} />
          )}
        </div>

        {/* 超时计费面板 */}
        <div className="col-span-4">
          <div className="card-dark p-5 h-full">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-white">超时计费提醒</h3>
              <span className="ml-auto rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">
                {overtimeVehicles.length} 辆
              </span>
            </div>
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {overtimeVehicles.length === 0 && (
                <p className="py-8 text-center text-sm text-white/30">暂无超时车辆</p>
              )}
              {overtimeVehicles.map((v) => {
                const existingReminder = getLatestReminder(v.id)
                return (
                <div key={v.id} className="rounded-lg bg-white/4 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-white">{v.vehiclePlate}</span>
                    <span className="text-xs text-white/40">{v.floor}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/50">
                    <Clock size={11} />
                    <span>{v.enterTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">停放 {v.duration}</span>
                    <span className="font-semibold text-amber-400">¥{v.fee}</span>
                  </div>
                  {existingReminder && (
                    <div className="text-[11px] text-emerald-400/70">
                      已提醒于 {existingReminder.reminderTime.split(' ')[1]}
                    </div>
                  )}
                  <button
                    onClick={() => handleSendReminder(v.id, v.vehiclePlate, v.fee)}
                    className={cn(
                      'flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors',
                      existingReminder
                        ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                        : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                    )}
                  >
                    {existingReminder ? <CheckCircle2 size={12} /> : <Send size={12} />}
                    {existingReminder ? '已提醒（再次发送）' : '发送缴费提醒'}
                  </button>
                </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* VIP预约管理 */}
      <div className="card-dark p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-white">VIP预约管理</h3>
            {pendingReservations.length > 0 && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                {pendingReservations.length} 待审批
              </span>
            )}
          </div>
          <button
            onClick={() => setShowNewReservation(true)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-dark-900 transition-colors hover:bg-amber-400"
          >
            <Plus size={14} />
            新增预约
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="py-3 text-left font-medium text-white/40">申请人</th>
                <th className="py-3 text-left font-medium text-white/40">电话</th>
                <th className="py-3 text-left font-medium text-white/40">预约日期</th>
                <th className="py-3 text-left font-medium text-white/40">预约时段</th>
                <th className="py-3 text-left font-medium text-white/40">时长</th>
                <th className="py-3 text-left font-medium text-white/40">状态</th>
                <th className="py-3 text-center font-medium text-white/40">操作</th>
              </tr>
            </thead>
            <tbody>
              {vipReservations.map((r) => (
                <tr key={r.id} className="border-b border-white/4 transition-colors hover:bg-white/3">
                  <td className="py-3 text-white">{r.applicant}</td>
                  <td className="py-3 font-mono text-white/70">{r.phone}</td>
                  <td className="py-3 text-white/70">{r.reserveDate}</td>
                  <td className="py-3 text-white/70">{r.reserveTime}</td>
                  <td className="py-3 text-white/70">{r.duration}小时</td>
                  <td className="py-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        r.status === '待审批' && 'bg-amber-500/15 text-amber-400',
                        r.status === '已批准' && 'bg-emerald-500/15 text-emerald-400',
                        r.status === '已拒绝' && 'bg-red-500/15 text-red-400',
                        r.status === '已完成' && 'bg-white/8 text-white/50'
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    {r.status === '待审批' ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleApprove(r.id)}
                          className="flex items-center gap-1 rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/25"
                        >
                          <Check size={12} />
                          审批
                        </button>
                        <button
                          onClick={() => handleReject(r.id)}
                          className="flex items-center gap-1 rounded-md bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/25"
                        >
                          <Ban size={12} />
                          拒绝
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-white/20">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 出入记录 */}
      <div className="card-dark overflow-hidden">
        <button
          onClick={() => setEntryExpanded(!entryExpanded)}
          className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-white/3"
        >
          <div className="flex items-center gap-2">
            <LogIn size={16} className="text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">车辆出入记录</h3>
            <span className="text-xs text-white/30">最近 {entryExitRecords.length} 条</span>
          </div>
          {entryExpanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
        </button>
        {entryExpanded && (
          <div className="animate-slide-up border-t border-white/6 px-5 pb-5 pt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="py-2 text-left font-medium text-white/40">车牌号</th>
                  <th className="py-2 text-left font-medium text-white/40">楼层</th>
                  <th className="py-2 text-left font-medium text-white/40">时间</th>
                  <th className="py-2 text-left font-medium text-white/40">类型</th>
                  <th className="py-2 text-left font-medium text-white/40">提醒状态</th>
                </tr>
              </thead>
              <tbody>
                {entryExitRecords.map((rec, i) => {
                  const matchedReminder = rec.type === '入场'
                    ? reminders.find((r) => r.vehiclePlate === rec.plate)
                    : undefined
                  return (
                  <tr key={i} className="border-b border-white/4">
                    <td className="py-2 font-mono text-white">{rec.plate}</td>
                    <td className="py-2 text-white/70">{rec.floor}</td>
                    <td className="py-2 text-white/70">{rec.time}</td>
                    <td className="py-2">
                      <span
                        className={cn(
                          'flex items-center gap-1 text-xs font-medium',
                          rec.type === '入场' ? 'text-emerald-400' : 'text-red-400'
                        )}
                      >
                        {rec.type === '入场' ? <LogIn size={12} /> : <LogOut size={12} />}
                        {rec.type}
                      </span>
                    </td>
                    <td className="py-2 text-xs">
                      {matchedReminder ? (
                        <span className="text-emerald-400">
                          已提醒于 {matchedReminder.reminderTime.split(' ')[1]} · ¥{matchedReminder.fee}
                        </span>
                      ) : (
                        <span className="text-white/20">-</span>
                      )}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 新增预约弹窗 */}
      {showNewReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowNewReservation(false)}>
          <div className="card-dark w-full max-w-md p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">新增VIP预约</h3>
              <button onClick={() => setShowNewReservation(false)} className="text-white/40 hover:text-white/70 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">申请人</label>
                <input
                  value={newRes.applicant}
                  onChange={(e) => setNewRes({ ...newRes, applicant: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-amber-500/50"
                  placeholder="请输入申请人姓名"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">联系电话</label>
                <input
                  value={newRes.phone}
                  onChange={(e) => setNewRes({ ...newRes, phone: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-amber-500/50"
                  placeholder="请输入联系电话"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">预约日期</label>
                  <input
                    type="date"
                    value={newRes.reserveDate}
                    onChange={(e) => setNewRes({ ...newRes, reserveDate: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-amber-500/50 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">预约时段</label>
                  <input
                    type="time"
                    value={newRes.reserveTime}
                    onChange={(e) => setNewRes({ ...newRes, reserveTime: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-amber-500/50 [color-scheme:dark]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">时长（小时）</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={newRes.duration}
                  onChange={(e) => setNewRes({ ...newRes, duration: Number(e.target.value) })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-amber-500/50"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowNewReservation(false)}
                className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                取消
              </button>
              <button
                onClick={handleAddReservation}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-dark-900 transition-colors hover:bg-amber-400"
              >
                确认预约
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
