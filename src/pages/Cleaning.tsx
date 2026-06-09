import { useState, useMemo, useEffect } from 'react'
import {
  Calendar,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Timer,
  ChevronDown,
  ChevronUp,
  X,
  User,
  MapPin,
  ListChecks,
  History,
  ArrowUpCircle,
  Sparkles,
  Filter,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCleaningStore } from '@/stores/cleaningStore'
import { cleaningLevelConfig } from '@/mock/cleaning'
import type { CleaningTask, CleaningEscalation } from '@/types'

const FLOORS = ['1F', '2F', '3F', '4F', '5F', 'B1'] as const
const LEVELS = ['一级', '二级', '三级'] as const
const STATUSES = ['待执行', '进行中', '已完成', '超时'] as const

const levelBadge: Record<string, { bg: string; text: string; border: string }> = {
  '一级': { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  '二级': { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  '三级': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
}

const levelCardStyle: Record<string, string> = {
  '一级': 'from-red-500/6 to-red-500/2',
  '二级': 'from-amber-500/6 to-amber-500/2',
  '三级': 'from-emerald-500/6 to-emerald-500/2',
}

const statsConfig = [
  { key: '待执行', icon: ClipboardList, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  { key: '进行中', icon: Timer, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  { key: '已完成', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  { key: '超时', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/15' },
]

const kanbanColumns = [
  { key: '待执行', label: '待执行', color: 'border-blue-500/20', headerBg: 'bg-blue-500/8', dot: 'bg-blue-400' },
  { key: '进行中', label: '进行中', color: 'border-amber-500/20', headerBg: 'bg-amber-500/8', dot: 'bg-amber-400' },
  { key: '已完成', label: '已完成', color: 'border-emerald-500/20', headerBg: 'bg-emerald-500/8', dot: 'bg-emerald-400' },
]

const areaDescriptions: Record<string, string> = {
  '1F中庭': '商场一层中央大厅，含休息区及展示区，人流量大',
  '1F入口A': '商场A入口门厅及外侧地垫区域，重点清洁区域',
  '1F入口B': '商场B入口门厅及外侧地垫区域，重点清洁区域',
  '1F卫生间': '一层公共卫生间，含4个隔间及洗手区',
  '2F走廊A区': '二层A区走廊通道，含商铺门前区域',
  '2F走廊B区': '二层B区走廊通道，含商铺门前区域',
  '2F卫生间': '二层公共卫生间，含4个隔间及洗手区',
  '3F儿童区': '三层儿童游乐区，需重点消毒清洁',
  '3F健身区': '三层健身区域，含器械区及更衣室',
  '3F卫生间': '三层公共卫生间，含4个隔间及洗手区',
  '4F影院大厅': '四层影院大厅及等候区',
  '4F餐饮区': '四层餐饮区，含餐桌及地面油污清洁',
  '4F卫生间': '四层公共卫生间，含4个隔间及洗手区',
  '5F美容区': '五层美容美发区域',
  'B1车库通道': '地下车库通道及出入口区域',
}

const cleaningChecklists: Record<string, string[]> = {
  '一级': ['地面清扫拖洗', '垃圾收集清运', '卫生间全面消毒', '镜面擦拭抛光', '洗手台清洁', '补齐消耗品', '检查通风设施', '门把手消毒'],
  '二级': ['地面清扫拖洗', '垃圾收集清运', '表面擦拭消毒', '扶手消毒', '检查照明设施', '清理杂物'],
  '三级': ['地面清扫', '垃圾收集', '设备表面清洁', '通风口检查', '消防设施检查'],
}

function getStatusHistory(task: CleaningTask, escalations: CleaningEscalation[]) {
  const history: { time: string; status: string; operator: string; reason?: string }[] = [{ time: `${task.taskDate} 08:00`, status: '待执行', operator: '系统' }]
  if (task.status === '进行中' || task.status === '已完成' || task.status === '超时') {
    const min = String(Math.floor(Math.random() * 30)).padStart(2, '0')
    history.push({ time: `${task.taskDate} 08:${min}`, status: '进行中', operator: task.assignee })
  }
  if (task.status === '已完成') {
    history.push({ time: task.completedAt, status: '已完成', operator: task.assignee })
  }
  if (task.status === '超时') {
    const min = String(Math.floor(Math.random() * 20) + 10).padStart(2, '0')
    history.push({ time: `${task.taskDate} 08:${min}`, status: '超时', operator: '系统' })
  }
  const taskEscalations = escalations.filter((e) => e.taskId === task.id)
  for (const esc of taskEscalations) {
    history.push({
      time: esc.escalateTime,
      status: '升级通知主管',
      operator: esc.operator,
      reason: esc.reason,
    })
  }
  history.sort((a, b) => a.time.localeCompare(b.time))
  return history
}

function getRemainingTime(task: CleaningTask): number {
  if (task.status === '已完成') return 0
  if (task.status === '超时') return -(Math.floor(Math.random() * 15) + 5)
  if (task.status === '进行中') return Math.floor(task.deadline * 0.4 + Math.random() * task.deadline * 0.2)
  return task.deadline
}

const statusStyle: Record<string, string> = {
  '待执行': 'bg-blue-500/15 text-blue-400',
  '进行中': 'bg-amber-500/15 text-amber-400',
  '已完成': 'bg-emerald-500/15 text-emerald-400',
  '超时': 'bg-red-500/15 text-red-400',
}

interface TaskDetailModalProps {
  task: CleaningTask
  escalations: CleaningEscalation[]
  onClose: () => void
  onEscalate: (task: CleaningTask) => void
}

function TaskDetailModal({ task, escalations, onClose, onEscalate }: TaskDetailModalProps) {
  const description = areaDescriptions[task.area] || '常规清洁区域'
  const checklist = cleaningChecklists[task.level] || []
  const history = getStatusHistory(task, escalations)
  const remaining = getRemainingTime(task)
  const lvl = levelBadge[task.level]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card-dark w-full max-w-lg p-6 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={cn('rounded-md px-2.5 py-1 text-xs font-medium border', lvl.bg, lvl.text, lvl.border)}>
              {task.level}
            </span>
            <h3 className="text-base font-semibold text-white">{task.area}</h3>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusStyle[task.status])}>
              {task.status}
            </span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg bg-white/4 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-white/70">
              <MapPin size={14} className="text-amber-400" />
              区域信息
            </div>
            <p className="text-sm text-white/60">{description}</p>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-white/40">楼层</span>
              <span className="text-white">{task.floor}</span>
              <span className="text-white/40 ml-4">截止时长</span>
              <span className="text-white">{task.deadline}分钟</span>
            </div>
          </div>

          <div className="rounded-lg bg-white/4 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-white/70">
              <ListChecks size={14} className="text-amber-400" />
              清洁清单
            </div>
            <div className="space-y-2">
              {checklist.map((item, i) => {
                const done = task.status === '已完成' || (task.status === '进行中' && i < Math.ceil(checklist.length / 2))
                return (
                  <div key={i} className="flex items-center gap-2.5 text-sm">
                    <div className={cn('flex h-4 w-4 items-center justify-center rounded border',
                      done ? 'bg-emerald-500/20 border-emerald-500/40' : 'border-white/15 bg-white/5'
                    )}>
                      {done && <CheckCircle2 size={10} className="text-emerald-400" />}
                    </div>
                    <span className={cn(done ? 'text-white/40 line-through' : 'text-white/70')}>{item}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-lg bg-white/4 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-white/70">
              <User size={14} className="text-amber-400" />
              负责人信息
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">姓名</span>
              <span className="text-white">{task.assignee}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">开始时间</span>
              <span className="text-white">{task.status === '待执行' ? '-' : `${task.taskDate} 08:00`}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">完成时间</span>
              <span className="text-white">{task.completedAt || '-'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">剩余时间</span>
              <span className={cn(
                'font-medium',
                remaining <= 0 ? 'text-red-400' : remaining <= 10 ? 'text-amber-400' : 'text-emerald-400'
              )}>
                {remaining <= 0 ? `超时 ${Math.abs(remaining)} 分钟` : `${remaining} 分钟`}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-white/4 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-white/70">
              <History size={14} className="text-amber-400" />
              状态变更记录
            </div>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="text-white/30 font-mono">{h.time}</span>
                  {h.status === '升级通知主管' ? (
                    <span className="rounded px-1.5 py-0.5 bg-red-500/15 text-red-400">升级通知主管</span>
                  ) : (
                    <span className={cn('rounded px-1.5 py-0.5', statusStyle[h.status])}>{h.status}</span>
                  )}
                  <span className="text-white/40">{h.operator}</span>
                  {h.reason && <span className="text-red-400/70">（{h.reason}）</span>}
                </div>
              ))}
            </div>
          </div>

          {task.status === '超时' && (
            <button
              onClick={() => onEscalate(task)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/15 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/25"
            >
              <ArrowUpCircle size={16} />
              升级通知主管
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Cleaning() {
  const { tasks, escalations, updateTask, addEscalation } = useCleaningStore()
  const [selectedDate, setSelectedDate] = useState('2025-06-09')
  const [floorFilter, setFloorFilter] = useState('全部')
  const [levelFilter, setLevelFilter] = useState('全部')
  const [statusFilter, setStatusFilter] = useState('全部')
  const [selectedTask, setSelectedTask] = useState<CleaningTask | null>(null)
  const [configExpanded, setConfigExpanded] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (floorFilter !== '全部' && t.floor !== floorFilter) return false
      if (levelFilter !== '全部' && t.level !== levelFilter) return false
      if (statusFilter !== '全部' && t.status !== statusFilter) return false
      return true
    })
  }, [tasks, floorFilter, levelFilter, statusFilter])

  const stats = useMemo(() => {
    const counts: Record<string, number> = { '待执行': 0, '进行中': 0, '已完成': 0, '超时': 0 }
    filteredTasks.forEach((t) => { counts[t.status]++ })
    return counts
  }, [filteredTasks])

  const kanbanData = useMemo(() => ({
    '待执行': filteredTasks.filter((t) => t.status === '待执行'),
    '进行中': filteredTasks.filter((t) => t.status === '进行中' || t.status === '超时'),
    '已完成': filteredTasks.filter((t) => t.status === '已完成'),
  }), [filteredTasks])

  function handleAutoAssign() {
    const pending = tasks.filter((t) => t.status === '待执行')
    if (pending.length === 0) {
      setToast({ message: '没有待执行的任务需要分配', type: 'success' })
      return
    }
    const assignees = [...new Set(tasks.map((t) => t.assignee))]
    if (assignees.length === 0) return

    const taskCountByAssignee = (name: string) => tasks.filter((t) => t.assignee === name).length
    const sameFloorAssignees = (floor: string) => assignees.filter((a) => tasks.some((t) => t.assignee === a && t.floor === floor))
    const sameLevelAssignees = (level: string) => assignees.filter((a) => tasks.some((t) => t.assignee === a && t.level === level))

    for (const task of pending) {
      let candidates = sameFloorAssignees(task.floor)
      if (candidates.length === 0) {
        candidates = sameLevelAssignees(task.level)
      }
      if (candidates.length === 0) {
        candidates = assignees
      }
      candidates.sort((a, b) => taskCountByAssignee(a) - taskCountByAssignee(b))
      updateTask(task.id, { assignee: candidates[0] })
    }
    setToast({ message: `已重新分配 ${pending.length} 项任务`, type: 'success' })
  }

  function handleEscalate(task: CleaningTask) {
    const now = new Date()
    const escalateTime = `${task.taskDate} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    addEscalation({
      id: `esc-${Date.now()}`,
      taskId: task.id,
      escalateTime,
      reason: '超时未完成',
      operator: '系统',
    })
    if (task.status === '进行中') {
      updateTask(task.id, { status: '超时' })
    }
    setToast({ message: `已通知主管：${task.area} 清洁任务超时，需紧急处理`, type: 'warning' })
  }

  function handleStatusChange(task: CleaningTask, newStatus: CleaningTask['status']) {
    const updates: Partial<CleaningTask> = { status: newStatus }
    if (newStatus === '已完成') {
      const now = new Date()
      updates.completedAt = `${task.taskDate} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    }
    updateTask(task.id, updates)
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={cn(
          'fixed top-6 right-6 z-[60] flex items-center gap-2 rounded-lg px-4 py-3 shadow-xl animate-slide-up',
          toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
        )}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
          <Sparkles size={22} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">清洁调度管理</h1>
          <p className="text-sm text-white/40">任务分配与实时监控</p>
        </div>
      </div>

      <div className="card-dark p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
            <Calendar size={14} className="text-white/40" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm text-white outline-none [color-scheme:dark]"
            />
          </div>
          <button
            onClick={handleAutoAssign}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-dark-900 transition-colors hover:bg-amber-400"
          >
            <Zap size={14} />
            自动分配任务
          </button>
          <div className="ml-auto flex items-center gap-2">
            <Filter size={14} className="text-white/30" />
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none [color-scheme:dark]"
            >
              <option value="全部">全部楼层</option>
              {FLOORS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none [color-scheme:dark]"
            >
              <option value="全部">全部等级</option>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none [color-scheme:dark]"
            >
              <option value="全部">全部状态</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statsConfig.map((cfg) => {
          const count = stats[cfg.key]
          const isTimeout = cfg.key === '超时' && count > 0
          return (
            <div
              key={cfg.key}
              className={cn(
                'card-dark p-4 transition-all duration-300 hover:border-white/12',
                isTimeout && 'animate-border-pulse-red'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-white/40">{cfg.key}</p>
                  <p className={cn('text-2xl font-bold', cfg.color)}>{count}</p>
                </div>
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', cfg.bg)}>
                  <cfg.icon size={20} className={cfg.color} />
                </div>
              </div>
              {isTimeout && (
                <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                  需要立即处理
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {kanbanColumns.map((col) => {
          const colTasks = kanbanData[col.key]
          return (
            <div key={col.key} className={cn('rounded-xl border', col.color, 'bg-white/2')}>
              <div className={cn('flex items-center justify-between rounded-t-xl px-4 py-3', col.headerBg)}>
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', col.dot)} />
                  <span className="text-sm font-semibold text-white">{col.label}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">{colTasks.length}</span>
                </div>
              </div>
              <div className="space-y-3 p-3 min-h-[200px] max-h-[520px] overflow-y-auto">
                {colTasks.length === 0 && (
                  <p className="py-8 text-center text-xs text-white/20">暂无任务</p>
                )}
                {colTasks.map((task) => {
                  const lvl = levelBadge[task.level]
                  const isTimeout = task.status === '超时'
                  const remaining = getRemainingTime(task)
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        'kanban-card-hover relative rounded-lg border p-3.5 cursor-pointer',
                        `bg-gradient-to-br ${levelCardStyle[task.level]} from-dark-800/80 to-dark-800/40`,
                        isTimeout ? 'animate-border-pulse-red border-red-500/40' : 'border-white/8 hover:border-white/15',
                        !isTimeout && 'hover:-translate-y-0.5'
                      )}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">{task.area}</span>
                        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium border', lvl.bg, lvl.text, lvl.border)}>
                          {task.level}
                        </span>
                      </div>
                      <div className="mb-1.5 flex items-center gap-2 text-xs text-white/40">
                        <MapPin size={11} />
                        <span>{task.floor}</span>
                      </div>
                      <div className="mb-2 flex items-center gap-2 text-xs text-white/50">
                        <User size={11} />
                        <span>{task.assignee}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-white/40">
                          <Clock size={11} />
                          <span>截止 {task.deadline}分钟</span>
                        </div>
                        <div className={cn(
                          'text-xs font-medium',
                          remaining <= 0 ? 'text-red-400' : remaining <= 10 ? 'text-amber-400' : 'text-white/40'
                        )}>
                          {remaining <= 0 ? `超时${Math.abs(remaining)}分` : `${remaining}分`}
                        </div>
                      </div>
                      <div className="mt-2 h-1 rounded-full bg-white/8 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            remaining <= 0 ? 'bg-red-500' : remaining <= 10 ? 'bg-amber-500' : 'bg-emerald-500/60'
                          )}
                          style={{ width: `${Math.max(0, Math.min(100, (remaining / task.deadline) * 100))}%` }}
                        />
                      </div>
                      {isTimeout && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEscalate(task) }}
                          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md bg-red-500/15 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/25"
                        >
                          <ArrowUpCircle size={12} />
                          升级通知主管
                        </button>
                      )}
                      {col.key === '待执行' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(task, '进行中') }}
                          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-500/10 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
                        >
                          开始执行
                        </button>
                      )}
                      {col.key === '进行中' && !isTimeout && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(task, '已完成') }}
                          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-500/10 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                        >
                          标记完成
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="card-dark overflow-hidden">
        <button
          onClick={() => setConfigExpanded(!configExpanded)}
          className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-white/3"
        >
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-white">清洁等级配置</h3>
          </div>
          {configExpanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
        </button>
        {configExpanded && (
          <div className="animate-slide-up border-t border-white/6 px-5 pb-5 pt-3">
            <div className="mb-4 grid grid-cols-3 gap-3">
              {cleaningLevelConfig.map((cfg) => (
                <div key={cfg.level} className={cn('rounded-lg border p-3', levelBadge[cfg.level].border, 'bg-white/3')}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', levelBadge[cfg.level].bg, levelBadge[cfg.level].text)}>
                      {cfg.level}
                    </span>
                    <span className="text-xs text-white/50">{cfg.frequency}</span>
                  </div>
                  <p className="text-xs text-white/40">{cfg.description}</p>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="py-3 text-left font-medium text-white/40">区域</th>
                    <th className="py-3 text-left font-medium text-white/40">楼层</th>
                    <th className="py-3 text-left font-medium text-white/40">清洁等级</th>
                    <th className="py-3 text-left font-medium text-white/40">频次(次/天)</th>
                    <th className="py-3 text-left font-medium text-white/40">负责人</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => {
                    const freqMap: Record<string, string> = { '一级': '6', '二级': '3', '三级': '2' }
                    return (
                      <tr key={t.id} className="border-b border-white/4 transition-colors hover:bg-white/3">
                        <td className="py-2.5 text-white">{t.area}</td>
                        <td className="py-2.5 text-white/70">{t.floor}</td>
                        <td className="py-2.5">
                          <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', levelBadge[t.level].bg, levelBadge[t.level].text)}>
                            {t.level}
                          </span>
                        </td>
                        <td className="py-2.5 text-white/70">{freqMap[t.level]}</td>
                        <td className="py-2.5 text-white/70">{t.assignee}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          escalations={escalations}
          onClose={() => setSelectedTask(null)}
          onEscalate={handleEscalate}
        />
      )}
    </div>
  )
}
