import { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts'
import {
  Zap, Droplets, Flame, TrendingUp, TrendingDown,
  AlertTriangle, Lightbulb, User, ArrowUp, ArrowDown,
  CalendarDays,
} from 'lucide-react'
import { useEnergyStore } from '@/stores/energyStore'
import { energySavingSuggestions, hourlyEnergyTrend, dailyEnergyTrend } from '@/mock/energy'
import type { EnergyAlarm } from '@/types'

type EnergyType = '电' | '水' | '气'

const ENERGY_CONFIG: Record<EnergyType, {
  icon: React.ReactNode
  unit: string
  gradient: [string, string]
  stroke: string
  fill: string
}> = {
  电: {
    icon: <Zap className="w-5 h-5" />,
    unit: 'kWh',
    gradient: ['#F59E0B', '#EF4444'],
    stroke: '#F59E0B',
    fill: '#F59E0B',
  },
  水: {
    icon: <Droplets className="w-5 h-5" />,
    unit: '吨',
    gradient: ['#3B82F6', '#06B6D4'],
    stroke: '#3B82F6',
    fill: '#3B82F6',
  },
  气: {
    icon: <Flame className="w-5 h-5" />,
    unit: 'm³',
    gradient: ['#F97316', '#EF4444'],
    stroke: '#F97316',
    fill: '#F97316',
  },
}

const TREND_KEYS: Record<EnergyType, 'electricity' | 'water' | 'gas'> = {
  电: 'electricity',
  水: 'water',
  气: 'gas',
}

const ALARM_ICONS: Record<EnergyType, React.ReactNode> = {
  电: <span className="text-lg">⚡</span>,
  水: <span className="text-lg">💧</span>,
  气: <span className="text-lg">🔥</span>,
}

const STATUS_BADGE: Record<string, { bg: string; text: string; pulse: boolean }> = {
  未处理: { bg: 'bg-red-500/20', text: 'text-red-400', pulse: true },
  处理中: { bg: 'bg-amber-500/20', text: 'text-amber-400', pulse: false },
  已处理: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', pulse: false },
}

const PRIORITY_STYLE: Record<string, { bg: string; text: string }> = {
  高: { bg: 'bg-red-500/20', text: 'text-red-400' },
  中: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  低: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
}

function getProgressColor(percent: number): [string, string] {
  if (percent < 0.6) return ['#10B981', '#34D399']
  if (percent < 0.85) return ['#F59E0B', '#FBBF24']
  return ['#EF4444', '#F87171']
}

function CircularRing({ percent, gradient, size = 120, strokeWidth = 8 }: {
  percent: number
  gradient: [string, string]
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(percent, 1))
  const center = size / 2
  const gradientId = `ring-grad-${gradient[0].replace('#', '')}`
  const clampedPercent = Math.min(percent, 1.15)

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradient[0]} />
          <stop offset="100%" stopColor={gradient[1]} />
        </linearGradient>
      </defs>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      {clampedPercent > 1 && (
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(239,68,68,0.3)"
          strokeWidth={strokeWidth + 6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="animate-pulse"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      )}
    </svg>
  )
}

export default function Energy() {
  const { energyData, alarms, updateAlarm } = useEnergyStore()
  const [selectedType, setSelectedType] = useState<EnergyType>('电')
  const [timeRange, setTimeRange] = useState<'日' | '周' | '月'>('日')

  const summary = useMemo(() => {
    const types: EnergyType[] = ['电', '水', '气']
    return types.map((type) => {
      const items = energyData.filter((d) => d.type === type)
      const totalValue = items.reduce((s, d) => s + d.value, 0)
      const totalThreshold = items.reduce((s, d) => s + d.threshold, 0)
      const percent = totalValue / totalThreshold
      return { type, totalValue, totalThreshold, percent, unit: ENERGY_CONFIG[type].unit }
    })
  }, [energyData])

  const tongbi: Record<EnergyType, number> = { 电: 8.5, 水: -3.2, 气: 5.1 }
  const huanbi: Record<EnergyType, number> = { 电: 2.1, 水: -1.5, 气: 3.8 }

  const trendData = useMemo(() => {
    const key = TREND_KEYS[selectedType]
    const thresholdVal = selectedType === '电' ? 2500 : selectedType === '水' ? 50 : 100
    return hourlyEnergyTrend.map((d) => ({
      time: d.hour,
      value: d[key],
      threshold: thresholdVal,
    }))
  }, [selectedType])

  const historicalData = useMemo(() => {
    if (timeRange === '日') return dailyEnergyTrend.slice(-7)
    if (timeRange === '周') return dailyEnergyTrend.filter((_, i) => i % 7 === 0)
    return dailyEnergyTrend.filter((_, i) => i % 30 === 0 || i === dailyEnergyTrend.length - 1)
  }, [timeRange])

  const handleAlarm = (alarm: EnergyAlarm) => {
    updateAlarm(alarm.id, { status: '处理中', handler: '当前用户', handledAt: new Date().toISOString().slice(0, 16).replace('T', ' ') })
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1. Real-time Overview Cards */}
      <div className="grid grid-cols-3 gap-4">
        {summary.map(({ type, totalValue, totalThreshold, percent, unit }) => {
          const cfg = ENERGY_CONFIG[type]
          const colorPair = getProgressColor(percent)
          const isOver = totalValue > totalThreshold
          const tb = tongbi[type]
          const hb = huanbi[type]
          return (
            <div
              key={type}
              className={`card-dark p-5 relative overflow-hidden group hover:border-amber-500/30 transition-all ${isOver ? 'ring-1 ring-red-500/30' : ''}`}
            >
              {isOver && (
                <div className="absolute inset-0 rounded-xl animate-pulse bg-red-500/5 pointer-events-none" />
              )}
              <div className="relative flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  <CircularRing
                    percent={percent}
                    gradient={colorPair}
                    size={110}
                    strokeWidth={8}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-white/40 text-xs">{Math.round(percent * 100)}%</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`${percent < 0.6 ? 'text-emerald-400' : percent < 0.85 ? 'text-amber-400' : 'text-red-400'}`}>
                      {cfg.icon}
                    </span>
                    <span className="text-sm text-white/50">{type}能耗</span>
                    {isOver && <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />}
                  </div>
                  <div className="font-['DM_Mono'] text-3xl font-medium tracking-tight text-white/90 leading-tight">
                    {totalValue.toLocaleString()}
                  </div>
                  <div className="text-xs text-white/30 mt-0.5">{unit}</div>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1 text-xs">
                      <span className="text-white/30">同比</span>
                      <span className={`flex items-center gap-0.5 ${tb >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {tb >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {Math.abs(tb)}%
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      <span className="text-white/30">环比</span>
                      <span className={`flex items-center gap-0.5 ${hb >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {hb >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {Math.abs(hb)}%
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-white/30 border-t border-white/5 pt-2">
                <span>阈值 {totalThreshold.toLocaleString()} {unit}</span>
                <span>{energyData.filter((d) => d.type === type).length} 个监测点</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 2. Energy Consumption Trend Chart */}
      <div className="card-dark p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-white/60 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            近24小时能耗趋势
          </h3>
          <div className="flex items-center gap-1 bg-dark-800/60 rounded-lg p-0.5">
            {(['电', '水', '气'] as EnergyType[]).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                  selectedType === t
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {ENERGY_CONFIG[t].icon}
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ENERGY_CONFIG[selectedType].fill} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={ENERGY_CONFIG[selectedType].fill} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="time"
                stroke="rgba(255,255,255,0.3)"
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                interval={2}
              />
              <YAxis
                stroke="rgba(255,255,255,0.3)"
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                formatter={(value: number, name: string) => {
                  if (name === 'value') return [value.toLocaleString(), selectedType + '能耗']
                  return [value.toLocaleString(), '阈值']
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={ENERGY_CONFIG[selectedType].stroke}
                strokeWidth={2.5}
                fill="url(#areaGradient)"
                dot={false}
                activeDot={{ r: 4, fill: ENERGY_CONFIG[selectedType].stroke, stroke: '#fff', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="threshold"
                stroke="#EF4444"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                fill="none"
                dot={false}
                activeDot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-6 mt-2 text-xs text-white/30">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 rounded" style={{ backgroundColor: ENERGY_CONFIG[selectedType].stroke }} />
            {selectedType}能耗
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 rounded border-t-2 border-dashed border-red-500" />
            阈值线
          </span>
        </div>
      </div>

      {/* 3. Alarm List & 4. Suggestions - side by side */}
      <div className="grid grid-cols-12 gap-4">
        {/* Alarm List */}
        <div className="col-span-7 card-dark p-5">
          <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            能耗告警列表
            <span className="ml-auto text-xs text-white/30">
              {alarms.filter((a) => a.status === '未处理').length} 条未处理
            </span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/30 text-xs border-b border-white/5">
                  <th className="text-left py-2 px-2 font-medium">类型</th>
                  <th className="text-left py-2 px-2 font-medium">告警时间</th>
                  <th className="text-left py-2 px-2 font-medium">数值/阈值</th>
                  <th className="text-left py-2 px-2 font-medium">状态</th>
                  <th className="text-left py-2 px-2 font-medium">处理人</th>
                  <th className="text-left py-2 px-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {alarms.map((alarm) => {
                  const badge = STATUS_BADGE[alarm.status]
                  return (
                    <tr key={alarm.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-2">
                        <span className="flex items-center gap-1.5">
                          {ALARM_ICONS[alarm.energyType]}
                          <span className="text-white/60">{alarm.energyType}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-white/40 font-['DM_Mono'] text-xs">
                        {alarm.alarmTime}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="text-red-400 font-['DM_Mono']">{alarm.value}</span>
                        <span className="text-white/20 mx-1">/</span>
                        <span className="text-white/40 font-['DM_Mono']">{alarm.threshold}</span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${badge.bg} ${badge.text} ${badge.pulse ? 'animate-pulse' : ''}`}>
                          {alarm.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-white/40">
                        {alarm.handler ? (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {alarm.handler}
                          </span>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2">
                        {alarm.status === '未处理' ? (
                          <button
                            onClick={() => handleAlarm(alarm)}
                            className="px-3 py-1 text-xs rounded-md bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                          >
                            处理
                          </button>
                        ) : (
                          <span className="text-white/15 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Energy-saving Suggestions */}
        <div className="col-span-5 card-dark p-5">
          <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            节能建议
          </h3>
          <div className="space-y-3">
            {energySavingSuggestions.map((s) => {
              const cfg = ENERGY_CONFIG[s.type as EnergyType]
              const ps = PRIORITY_STYLE[s.priority] || PRIORITY_STYLE['低']
              return (
                <div
                  key={s.id}
                  className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-amber-500/20 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cfg.stroke === '#F59E0B' ? 'text-amber-400' : cfg.stroke === '#3B82F6' ? 'text-blue-400' : 'text-orange-400'}>
                      {cfg.icon}
                    </span>
                    <span className="text-xs text-white/40">{s.area}</span>
                    <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] ${ps.bg} ${ps.text}`}>
                      {s.priority}优先级
                    </span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed mb-2 group-hover:text-white/75 transition-colors">
                    {s.suggestion}
                  </p>
                  <div className="flex items-center gap-1 text-xs">
                    <TrendingDown className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">预计节省 {s.savingRate}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 5. Historical Data */}
      <div className="card-dark p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-white/60 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-amber-500" />
            历史能耗对比
          </h3>
          <div className="flex items-center gap-1 bg-dark-800/60 rounded-lg p-0.5">
            {(['日', '周', '月'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  timeRange === t
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historicalData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.3)"
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.3)"
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = { electricity: '用电(kWh)', water: '用水(吨)', gas: '用气(m³)' }
                  return [value.toLocaleString(), labels[name] || name]
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}
                formatter={(value: string) => {
                  const labels: Record<string, string> = { electricity: '用电', water: '用水', gas: '用气' }
                  return <span className="text-white/50">{labels[value] || value}</span>
                }}
              />
              <Bar dataKey="electricity" fill="#F59E0B" radius={[3, 3, 0, 0]} barSize={12} />
              <Bar dataKey="water" fill="#3B82F6" radius={[3, 3, 0, 0]} barSize={12} />
              <Bar dataKey="gas" fill="#F97316" radius={[3, 3, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  )
}
