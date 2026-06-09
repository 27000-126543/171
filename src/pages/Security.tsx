import { useState, useEffect } from 'react'
import {
  CalendarDays, Filter, Zap, Hand, ChevronDown, Users, Coffee,
  CalendarOff, Shield, MapPin, Clock, Flame, Eye, AlertTriangle,
  Wrench, UserCheck, Send, CheckCircle2, X, Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { useSecurityStore } from '@/stores/securityStore'
import type { SecurityShift, IncidentEvent } from '@/types'

const shiftColumns: { key: SecurityShift['shift']; label: string; time: string }[] = [
  { key: '白班', label: '白班', time: '8:00-16:00' },
  { key: '中班', label: '中班', time: '16:00-24:00' },
  { key: '夜班', label: '夜班', time: '0:00-8:00' },
]

const areaRows = ['1F', '2F', '3F', '4F-5F', 'B1', 'B2-B3']

const rankConfig: Record<string, { color: string; bg: string; label: string }> = {
  '主管': { color: 'text-amber-400', bg: 'bg-amber-500/20', label: '主管' },
  '班长': { color: 'text-blue-400', bg: 'bg-blue-500/20', label: '班长' },
  '队员': { color: 'text-white/50', bg: 'bg-white/10', label: '队员' },
}

const incidentTypeConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  '火警': { color: 'text-red-400', bg: 'bg-red-500/15', icon: <Flame size={16} /> },
  '盗窃': { color: 'text-amber-400', bg: 'bg-amber-500/15', icon: <Eye size={16} /> },
  '冲突': { color: 'text-orange-400', bg: 'bg-orange-500/15', icon: <AlertTriangle size={16} /> },
  '设备故障': { color: 'text-blue-400', bg: 'bg-blue-500/15', icon: <Wrench size={16} /> },
  '人员受伤': { color: 'text-rose-400', bg: 'bg-rose-500/15', icon: <UserCheck size={16} /> },
  '非法入侵': { color: 'text-purple-400', bg: 'bg-purple-500/15', icon: <Shield size={16} /> },
}

const incidentStatusConfig: Record<string, { color: string; bg: string; pulse?: boolean }> = {
  '待处置': { color: 'text-red-400', bg: 'bg-red-500/15', pulse: true },
  '处置中': { color: 'text-amber-400', bg: 'bg-amber-500/15' },
  '已处置': { color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  '已归档': { color: 'text-white/40', bg: 'bg-white/8' },
}

const areaRiskLevels: Record<string, { level: string; color: string; dot: string }> = {
  '1F': { level: '高', color: 'text-red-400', dot: 'bg-red-500' },
  '2F': { level: '中', color: 'text-amber-400', dot: 'bg-amber-500' },
  '3F': { level: '中', color: 'text-amber-400', dot: 'bg-amber-500' },
  '4F-5F': { level: '高', color: 'text-red-400', dot: 'bg-red-500' },
  'B1': { level: '低', color: 'text-emerald-400', dot: 'bg-emerald-500' },
  'B2-B3': { level: '低', color: 'text-emerald-400', dot: 'bg-emerald-500' },
}

const patrolRoutes = [
  { name: '1F巡逻线', color: '#F0A500', checkpoints: ['入口A', '珠宝区', '化妆品区', '中庭', '入口B'], duration: '45分钟', staff: '钱卫' },
  { name: '2F巡逻线', color: '#3B82F6', checkpoints: ['A区', 'B区', '扶梯口', '卫生间'], duration: '30分钟', staff: '孙磊' },
  { name: '3F巡逻线', color: '#10B981', checkpoints: ['儿童区', '教育区', '健身区', '扶梯口'], duration: '35分钟', staff: '郑涛' },
  { name: '地下巡逻线', color: '#A855F7', checkpoints: ['车库入口', '便利店', '车库出口', '货梯间'], duration: '40分钟', staff: '褚明' },
]

export default function Security() {
  const { staff, shifts, incidents, updateIncident, updateStaff, addShifts } = useSecurityStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [selectedDate, setSelectedDate] = useState(today)
  const [shiftFilter, setShiftFilter] = useState<SecurityShift['shift'] | '全部'>('全部')
  const [areaFilter, setAreaFilter] = useState<string>('全部')
  const [statusFilter, setStatusFilter] = useState<IncidentEvent['status'] | '全部'>('全部')
  const [showShiftDrop, setShowShiftDrop] = useState(false)
  const [showAreaDrop, setShowAreaDrop] = useState(false)
  const [showStatusDrop, setShowStatusDrop] = useState(false)
  const [autoScheduling, setAutoScheduling] = useState(false)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolutionText, setResolutionText] = useState('')
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' })

  useEffect(() => {
    const handler = () => {
      setShowShiftDrop(false)
      setShowAreaDrop(false)
      setShowStatusDrop(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const onDuty = staff.filter((s) => s.status === '在岗').length
  const offDuty = staff.filter((s) => s.status === '休息').length
  const onLeave = staff.filter((s) => s.status === '请假').length

  const todayShifts = shifts.filter((s) => s.shiftDate === selectedDate)

  const filteredShifts = todayShifts.filter((s) => {
    if (shiftFilter !== '全部' && s.shift !== shiftFilter) return false
    if (areaFilter !== '全部' && s.area !== areaFilter) return false
    return true
  })

  const getStaffRank = (staffName: string) => {
    const s = staff.find((p) => p.name === staffName)
    return s?.rank ?? '队员'
  }

  const showToast = (msg: string) => {
    setToast({ show: true, msg })
    setTimeout(() => setToast({ show: false, msg: '' }), 2500)
  }

  const handleAutoSchedule = () => {
    setAutoScheduling(true)

    setTimeout(() => {
      const onDutyStaff = staff.filter((s) => s.status === '在岗')
      const dateShifts = shifts.filter((s) => s.shiftDate === selectedDate)
      const riskOrder: Record<string, number> = { '高': 0, '中': 1, '低': 2 }
      const sortedAreas = [...areaRows].sort((a, b) =>
        (riskOrder[areaRiskLevels[a]?.level ?? '低'] ?? 2) - (riskOrder[areaRiskLevels[b]?.level ?? '低'] ?? 2)
      )

      const newShifts: SecurityShift[] = []
      let shiftCounter = shifts.length

      for (const area of sortedAreas) {
        for (const col of shiftColumns) {
          const existing = dateShifts.filter((s) => s.area === area && s.shift === col.key)
          if (existing.length > 0) continue

          const assignedNamesOnThisShift = new Set(
            dateShifts.filter((s) => s.shift === col.key).map((s) => s.staffName)
          )
          const alreadyNewOnThisShift = new Set(
            newShifts.filter((s) => s.shift === col.key).map((s) => s.staffName)
          )

          const available = onDutyStaff.filter((s) =>
            !assignedNamesOnThisShift.has(s.name) && !alreadyNewOnThisShift.has(s.name)
          )

          const preferred = available.find((s) => s.area === area || s.area === '全区域')
          const picked = preferred ?? available[0]

          if (picked) {
            shiftCounter++
            newShifts.push({
              id: `SH${String(shiftCounter).padStart(3, '0')}`,
              staffId: picked.id,
              staffName: picked.name,
              shiftDate: selectedDate,
              shift: col.key,
              area,
              patrolRoute: `${area}巡查路线`,
            })
          }
        }
      }

      if (newShifts.length > 0) {
        addShifts(newShifts)
        showToast(`自动排班完成，已生成 ${newShifts.length} 条新排班`)
      } else {
        showToast('所有区域班次已排满，无需新增排班')
      }

      setAutoScheduling(false)
    }, 1000)
  }

  const handleDispatch = (incident: IncidentEvent) => {
    const availableStaff = staff.filter((s) => s.status === '在岗')
    const assigned = availableStaff.find((s) => s.area === incident.location.replace(/F.*$/, 'F'))
      ?? availableStaff[0]
    if (assigned) {
      updateIncident(incident.id, { assignedTo: assigned.name, status: '处置中' })
    }
  }

  const handleResolve = (incidentId: string) => {
    if (!resolutionText.trim()) return
    updateIncident(incidentId, {
      status: '已处置',
      resolution: resolutionText.trim(),
      resolvedAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
    })
    setResolvingId(null)
    setResolutionText('')
  }

  const filteredIncidents = incidents.filter((i) => {
    if (statusFilter !== '全部' && i.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      {toast.show && (
        <div className="fixed right-6 top-20 z-[100] animate-slide-up rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-400 backdrop-blur-sm">
          <div className="flex items-center gap-2"><CheckCircle2 size={16} />{toast.msg}</div>
        </div>
      )}
      {/* Top Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-dark-800/60 px-3 py-2">
          <CalendarDays size={16} className="text-amber-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-none bg-transparent text-sm text-white/80 outline-none"
          />
        </div>

        <button
          onClick={handleAutoSchedule}
          disabled={autoScheduling}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-dark-900 transition-all hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 disabled:opacity-60"
        >
          {autoScheduling ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
          自动排班
        </button>

        <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-dark-800/60 px-4 py-2 text-sm text-white/70 transition-colors hover:border-white/20 hover:text-white/90">
          <Hand size={16} />
          手动排班
        </button>

        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowShiftDrop(!showShiftDrop); setShowAreaDrop(false); setShowStatusDrop(false) }}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-dark-800/60 px-3 py-2 text-sm text-white/70 transition-colors hover:border-white/20"
          >
            <Filter size={14} />
            {shiftFilter === '全部' ? '班次类型' : shiftFilter}
            <ChevronDown size={14} />
          </button>
          {showShiftDrop && (
            <div className="absolute left-0 top-full z-20 mt-1 min-w-[120px] rounded-lg border border-white/10 bg-dark-800 py-1 shadow-xl animate-fade-in">
              <button onClick={() => { setShiftFilter('全部'); setShowShiftDrop(false) }} className={`w-full px-3 py-2 text-left text-sm hover:bg-white/8 ${shiftFilter === '全部' ? 'text-amber-500' : 'text-white/70'}`}>全部</button>
              {(['白班', '中班', '夜班'] as const).map((s) => (
                <button key={s} onClick={() => { setShiftFilter(s); setShowShiftDrop(false) }} className={`w-full px-3 py-2 text-left text-sm hover:bg-white/8 ${shiftFilter === s ? 'text-amber-500' : 'text-white/70'}`}>{s}</button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowAreaDrop(!showAreaDrop); setShowShiftDrop(false); setShowStatusDrop(false) }}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-dark-800/60 px-3 py-2 text-sm text-white/70 transition-colors hover:border-white/20"
          >
            <Filter size={14} />
            {areaFilter === '全部' ? '区域' : areaFilter}
            <ChevronDown size={14} />
          </button>
          {showAreaDrop && (
            <div className="absolute left-0 top-full z-20 mt-1 min-w-[120px] rounded-lg border border-white/10 bg-dark-800 py-1 shadow-xl animate-fade-in">
              <button onClick={() => { setAreaFilter('全部'); setShowAreaDrop(false) }} className={`w-full px-3 py-2 text-left text-sm hover:bg-white/8 ${areaFilter === '全部' ? 'text-amber-500' : 'text-white/70'}`}>全部</button>
              {areaRows.map((a) => (
                <button key={a} onClick={() => { setAreaFilter(a); setShowAreaDrop(false) }} className={`w-full px-3 py-2 text-left text-sm hover:bg-white/8 ${areaFilter === a ? 'text-amber-500' : 'text-white/70'}`}>{a}</button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowStatusDrop(!showStatusDrop); setShowShiftDrop(false); setShowAreaDrop(false) }}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-dark-800/60 px-3 py-2 text-sm text-white/70 transition-colors hover:border-white/20"
          >
            <Filter size={14} />
            {statusFilter === '全部' ? '事件状态' : statusFilter}
            <ChevronDown size={14} />
          </button>
          {showStatusDrop && (
            <div className="absolute left-0 top-full z-20 mt-1 min-w-[120px] rounded-lg border border-white/10 bg-dark-800 py-1 shadow-xl animate-fade-in">
              <button onClick={() => { setStatusFilter('全部'); setShowStatusDrop(false) }} className={`w-full px-3 py-2 text-left text-sm hover:bg-white/8 ${statusFilter === '全部' ? 'text-amber-500' : 'text-white/70'}`}>全部</button>
              {(['待处置', '处置中', '已处置', '已归档'] as const).map((s) => (
                <button key={s} onClick={() => { setStatusFilter(s); setShowStatusDrop(false) }} className={`w-full px-3 py-2 text-left text-sm hover:bg-white/8 ${statusFilter === s ? 'text-amber-500' : 'text-white/70'}`}>{s}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Staff Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-dark flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
            <Users size={24} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white/90">{onDuty}</p>
            <p className="text-sm text-white/45">在岗人数</p>
          </div>
        </div>
        <div className="card-dark flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15">
            <Coffee size={24} className="text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white/90">{offDuty}</p>
            <p className="text-sm text-white/45">休息人数</p>
          </div>
        </div>
        <div className="card-dark flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15">
            <CalendarOff size={24} className="text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white/90">{onLeave}</p>
            <p className="text-sm text-white/45">请假人数</p>
          </div>
        </div>
      </div>

      {/* Shift Calendar/Schedule View */}
      <div className="card-dark overflow-hidden p-5">
        <h2 className="mb-4 text-base font-semibold text-white/80">排班表 · {selectedDate}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-white/6 px-4 py-3 text-left font-medium text-white/40">区域</th>
                {shiftColumns.map((col) => (
                  <th key={col.key} className="border-b border-white/6 px-4 py-3 text-center font-medium text-white/40">
                    <span className="text-white/60">{col.label}</span>
                    <span className="ml-1.5 text-xs text-white/30">{col.time}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {areaRows.map((area) => {
                const isAreaFiltered = areaFilter !== '全部' && area !== areaFilter
                return (
                  <tr key={area} className={`group ${isAreaFiltered ? 'opacity-30' : ''}`}>
                    <td className="border-b border-white/4 px-4 py-3 font-medium text-white/60">{area}</td>
                    {shiftColumns.map((col) => {
                      const isShiftFiltered = shiftFilter !== '全部' && col.key !== shiftFilter
                      const isFiltered = isAreaFiltered || isShiftFiltered
                      const assigned = filteredShifts.filter((s) => s.area === area && s.shift === col.key)
                      return (
                        <td key={col.key} className={`border-b border-white/4 px-2 py-2 ${isFiltered ? 'opacity-30' : ''}`}>
                          {isFiltered ? (
                            <div className="flex items-center justify-center rounded-lg border border-dashed border-white/8 px-2 py-1.5 text-xs text-white/20">未排班</div>
                          ) : assigned.length > 0 ? assigned.map((s) => {
                            const rank = getStaffRank(s.staffName)
                            const rc = rankConfig[rank]
                            return (
                              <div key={s.id} className="mb-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 px-2 py-1.5 last:mb-0">
                                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${rc.bg} ${rc.color}`}>
                                  {rank}
                                </span>
                                <span className="text-xs text-white/75">{s.staffName}</span>
                              </div>
                            )
                          }) : (
                            <div className="flex items-center justify-center rounded-lg border border-dashed border-white/8 px-2 py-1.5 text-xs text-white/20">未排班</div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patrol Route Panel & Area Risk Panel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Patrol Route Floor Plan */}
        <div className="card-dark p-5 lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-white/80">巡逻路线图</h2>
          <div className="relative mb-4 overflow-hidden rounded-lg bg-dark-800/50" style={{ height: 280 }}>
            <svg viewBox="0 0 600 280" className="h-full w-full">
              <rect x="20" y="20" width="560" height="240" rx="8" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x="40" y="50" fill="rgba(255,255,255,0.2)" fontSize="12">1F</text>
              <text x="40" y="110" fill="rgba(255,255,255,0.2)" fontSize="12">2F</text>
              <text x="40" y="170" fill="rgba(255,255,255,0.2)" fontSize="12">3F</text>
              <text x="40" y="230" fill="rgba(255,255,255,0.2)" fontSize="12">B1-B3</text>
              <rect x="80" y="35" width="120" height="40" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" />
              <rect x="220" y="35" width="120" height="40" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" />
              <rect x="360" y="35" width="120" height="40" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" />
              <rect x="80" y="95" width="120" height="40" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" />
              <rect x="220" y="95" width="120" height="40" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" />
              <rect x="360" y="95" width="120" height="40" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" />
              <rect x="80" y="155" width="120" height="40" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" />
              <rect x="220" y="155" width="120" height="40" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" />
              <rect x="360" y="155" width="120" height="40" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" />
              <rect x="80" y="210" width="200" height="40" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" />
              <rect x="300" y="210" width="180" height="40" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" />

              <polyline points="100,55 180,55 280,55 380,55 480,55" fill="none" stroke="#F0A500" strokeWidth="2.5" strokeDasharray="6,4" opacity="0.8" />
              <circle cx="100" cy="55" r="5" fill="#F0A500" />
              <circle cx="280" cy="55" r="5" fill="#F0A500" />
              <circle cx="480" cy="55" r="5" fill="#F0A500" />

              <polyline points="100,115 220,115 360,115" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeDasharray="6,4" opacity="0.8" />
              <circle cx="100" cy="115" r="5" fill="#3B82F6" />
              <circle cx="220" cy="115" r="5" fill="#3B82F6" />
              <circle cx="360" cy="115" r="5" fill="#3B82F6" />

              <polyline points="100,175 220,175 360,175 480,175" fill="none" stroke="#10B981" strokeWidth="2.5" strokeDasharray="6,4" opacity="0.8" />
              <circle cx="100" cy="175" r="5" fill="#10B981" />
              <circle cx="280" cy="175" r="5" fill="#10B981" />
              <circle cx="480" cy="175" r="5" fill="#10B981" />

              <polyline points="100,230 250,230 380,230 480,230" fill="none" stroke="#A855F7" strokeWidth="2.5" strokeDasharray="6,4" opacity="0.8" />
              <circle cx="100" cy="230" r="5" fill="#A855F7" />
              <circle cx="250" cy="230" r="5" fill="#A855F7" />
              <circle cx="480" cy="230" r="5" fill="#A855F7" />
            </svg>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {patrolRoutes.map((route) => (
              <div key={route.name} className="rounded-lg bg-dark-800/50 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: route.color }} />
                  <span className="text-sm font-medium text-white/75">{route.name}</span>
                </div>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs text-white/40">
                  <MapPin size={12} />
                  <span>{route.checkpoints.join(' → ')}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span className="flex items-center gap-1"><Clock size={11} />{route.duration}</span>
                  <span className="flex items-center gap-1"><Users size={11} />{route.staff}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Area Risk Level Panel */}
        <div className="card-dark p-5">
          <h2 className="mb-4 text-base font-semibold text-white/80">区域风险等级</h2>
          <div className="space-y-3">
            {Object.entries(areaRiskLevels).map(([area, risk]) => (
              <div key={area} className="flex items-center justify-between rounded-lg bg-dark-800/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${risk.dot}`} />
                  <span className="text-sm text-white/70">{area}</span>
                </div>
                <span className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                  risk.level === '高' ? 'bg-red-500/15 text-red-400' :
                  risk.level === '中' ? 'bg-amber-500/15 text-amber-400' :
                  'bg-emerald-500/15 text-emerald-400'
                }`}>
                  {risk.level}风险
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg bg-dark-800/30 p-3">
            <p className="mb-2 text-xs font-medium text-white/40">风险说明</p>
            <div className="space-y-1 text-xs text-white/30">
              <p><span className="text-red-400">高风险</span>：人员密集区域，需加强巡逻</p>
              <p><span className="text-amber-400">中风险</span>：常规巡查区域</p>
              <p><span className="text-emerald-400">低风险</span>：监控覆盖充足区域</p>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Events Section */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-white/80">事件记录</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredIncidents.map((incident) => {
            const tc = incidentTypeConfig[incident.type] ?? incidentTypeConfig['冲突']
            const sc = incidentStatusConfig[incident.status] ?? incidentStatusConfig['已归档']
            const isResolving = resolvingId === incident.id
            return (
              <div key={incident.id} className="card-dark p-5 transition-all hover:border-white/12">
                <div className="mb-3 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${tc.bg} ${tc.color}`}>
                    {tc.icon}
                    {incident.type}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${sc.bg} ${sc.color} ${sc.pulse ? 'animate-pulse-slow' : ''}`}>
                    {sc.pulse && <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />}
                    {incident.status}
                  </span>
                </div>

                <div className="mb-2 flex items-center gap-2 text-xs text-white/40">
                  <MapPin size={12} />
                  <span>{incident.location}</span>
                  <span className="text-white/20">|</span>
                  <Clock size={12} />
                  <span>{incident.eventTime}</span>
                </div>

                <p className="mb-3 text-sm leading-relaxed text-white/55">{incident.description}</p>

                <div className="mb-3 flex items-center gap-2 text-xs text-white/40">
                  <Shield size={12} />
                  <span>处置人：{incident.assignedTo || '未指派'}</span>
                </div>

                {incident.status === '已处置' && incident.resolution && (
                  <div className="mb-3 rounded-lg bg-dark-800/40 p-3">
                    <div className="mb-1 text-xs font-medium text-emerald-400/80">处置结果</div>
                    <p className="text-xs leading-relaxed text-white/45">{incident.resolution}</p>
                    <p className="mt-1 text-[10px] text-white/25">完成时间：{incident.resolvedAt}</p>
                  </div>
                )}

                {isResolving && (
                  <div className="mb-3 rounded-lg border border-white/8 bg-dark-800/50 p-3">
                    <textarea
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      placeholder="请填写处置结果..."
                      className="mb-2 w-full rounded border border-white/8 bg-dark-800/30 px-2 py-1.5 text-xs text-white/80 placeholder-white/25 outline-none focus:border-amber-500/40"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolve(incident.id)}
                        className="flex items-center gap-1 rounded bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400 hover:bg-emerald-500/30"
                      >
                        <CheckCircle2 size={12} /> 确认完成
                      </button>
                      <button
                        onClick={() => { setResolvingId(null); setResolutionText('') }}
                        className="rounded bg-white/8 px-3 py-1 text-xs text-white/50 hover:bg-white/12"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 border-t border-white/6 pt-3">
                  {incident.status === '待处置' && (
                    <button
                      onClick={() => handleDispatch(incident)}
                      className="flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/25"
                    >
                      <Send size={13} /> 派单
                    </button>
                  )}
                  {incident.status === '处置中' && !isResolving && (
                    <button
                      onClick={() => setResolvingId(incident.id)}
                      className="flex items-center gap-1 rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/25"
                    >
                      <CheckCircle2 size={13} /> 处置完成
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {filteredIncidents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-white/30">
            <Shield size={48} className="mb-4" />
            <p className="text-lg">暂无事件记录</p>
          </div>
        )}
      </div>
    </div>
  )
}
