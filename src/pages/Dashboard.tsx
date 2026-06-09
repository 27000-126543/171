import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import {
  TrendingUp, TrendingDown, AlertTriangle, Flame,
  Droplets, ShieldAlert, Clock, FileText,
  Receipt, AlertCircle, Zap,
} from 'lucide-react'
import { shops } from '@/mock/shops'
import { kpiSummary, dailyFootTraffic } from '@/mock/statistics'
import { energyAlarms, energyData } from '@/mock/energy'
import { incidentEvents } from '@/mock/security'
import { useShopStore } from '@/stores/shopStore'
import { useOperationStore } from '@/stores/operationStore'

const SHOP_STATUS_COLORS: Record<string, string> = {
  '已出租': '#10B981',
  '空置': '#EF4444',
  '即将到期': '#F59E0B',
  '装修中': '#6366F1',
}

const ALERT_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  '火警': { color: 'text-red-400', icon: <Flame className="w-4 h-4" /> },
  '电': { color: 'text-amber-400', icon: <Zap className="w-4 h-4" /> },
  '水': { color: 'text-blue-400', icon: <Droplets className="w-4 h-4" /> },
  '气': { color: 'text-orange-400', icon: <AlertTriangle className="w-4 h-4" /> },
  '盗窃': { color: 'text-purple-400', icon: <ShieldAlert className="w-4 h-4" /> },
  '冲突': { color: 'text-yellow-400', icon: <AlertTriangle className="w-4 h-4" /> },
  '设备故障': { color: 'text-gray-400', icon: <AlertCircle className="w-4 h-4" /> },
  '人员受伤': { color: 'text-red-400', icon: <AlertCircle className="w-4 h-4" /> },
  '非法入侵': { color: 'text-red-500', icon: <ShieldAlert className="w-4 h-4" /> },
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
}

export default function Dashboard() {
  const { bills } = useShopStore()
  const { plans } = useOperationStore()

  const shopStatusData = useMemo(() => {
    const countMap: Record<string, number> = {}
    shops.forEach((s) => {
      countMap[s.status] = (countMap[s.status] || 0) + 1
    })
    return Object.entries(countMap).map(([name, value]) => ({ name, value }))
  }, [])

  const todoItems = useMemo(() => {
    const pendingPlans = plans.filter((p) => p.status === '待审批').length
    const overdueBills = bills.filter((b) => b.status === '逾期').length
    const pendingIncidents = incidentEvents.filter((e) => e.status === '待处置' || e.status === '处置中').length
    return [
      { label: '待审批方案', count: pendingPlans, priority: 'medium' as const, icon: <FileText className="w-4 h-4" /> },
      { label: '逾期账单', count: overdueBills, priority: 'high' as const, icon: <Receipt className="w-4 h-4" /> },
      { label: '异常事件待处置', count: pendingIncidents, priority: 'high' as const, icon: <AlertCircle className="w-4 h-4" /> },
    ]
  }, [plans, bills])

  const alerts = useMemo(() => {
    const energy: Array<{ time: string; type: string; desc: string; status: string }> = energyAlarms
      .filter((a) => a.status === '未处理' || a.status === '处理中')
      .map((a) => ({
        time: a.alarmTime,
        type: a.energyType,
        desc: `${a.energyType}能耗超限 ${energyData.find((e) => e.id === a.energyId)?.area || ''} (当前${a.value}/${a.threshold})`,
        status: a.status,
      }))
    const security: Array<{ time: string; type: string; desc: string; status: string }> = incidentEvents
      .filter((e) => e.status === '待处置' || e.status === '处置中')
      .map((e) => ({
        time: e.eventTime,
        type: e.type,
        desc: `${e.type} ${e.location} - ${e.description}`,
        status: e.status,
      }))
    return [...energy, ...security].sort((a, b) => b.time.localeCompare(a.time))
  }, [])

  const recentAlerts = useMemo(() => {
    const all = [
      ...energyAlarms.map((a) => ({ time: a.alarmTime, type: a.energyType, desc: `${a.energyType}能耗超限 - ${energyData.find((e) => e.id === a.energyId)?.area || ''}`, status: a.status })),
      ...incidentEvents.map((e) => ({ time: e.eventTime, type: e.type, desc: `${e.location} - ${e.description.slice(0, 20)}`, status: e.status })),
    ]
    return all.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 8)
  }, [])

  const footTraffic7Days = useMemo(() => dailyFootTraffic.slice(-7), [])

  const kpiCards = useMemo(() => [
    {
      label: '出租率',
      value: `${kpiSummary.occupancyRate}%`,
      change: '+2.1%',
      up: true,
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      accent: 'from-emerald-500/20 to-emerald-500/5',
    },
    {
      label: '月营收',
      value: '¥2,185,000',
      change: '+5.3%',
      up: true,
      icon: <TrendingUp className="w-5 h-5 text-amber-400" />,
      accent: 'from-amber-500/20 to-amber-500/5',
    },
    {
      label: '今日客流',
      value: '12,580',
      change: '-1.2%',
      up: false,
      icon: <TrendingDown className="w-5 h-5 text-blue-400" />,
      accent: 'from-blue-500/20 to-blue-500/5',
    },
    {
      label: '告警数',
      value: '7',
      change: '+3',
      up: true,
      icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
      accent: 'from-red-500/20 to-red-500/5',
    },
  ], [])

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-900/30 via-orange-900/20 to-amber-900/20 border border-red-500/20">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
          <div className="overflow-hidden flex-1">
            <div className="flex gap-8 animate-marquee whitespace-nowrap">
              {alerts.map((a, i) => {
                const cfg = ALERT_CONFIG[a.type] || { color: 'text-gray-400', icon: <AlertCircle className="w-4 h-4" /> }
                const statusPulse = a.status === '未处理' ? 'animate-pulse' : ''
                return (
                  <span key={i} className={`inline-flex items-center gap-1.5 text-sm ${cfg.color} ${statusPulse}`}>
                    {cfg.icon}
                    <span className="text-white/60">[{a.time.slice(11)}]</span>
                    {a.desc}
                  </span>
                )
              })}
            </div>
          </div>
          <span className="text-xs text-red-400/80 border border-red-500/30 rounded px-2 py-0.5 shrink-0">
            {alerts.length} 条活跃告警
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="card-dark p-5 relative overflow-hidden group hover:border-amber-500/30 transition-colors"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/50">{card.label}</span>
                {card.icon}
              </div>
              <div className="font-mono text-3xl font-medium tracking-tight text-white/90 mb-1">
                {card.value}
              </div>
              <div className={`flex items-center gap-1 text-xs ${card.up ? (card.label === '告警数' ? 'text-red-400' : 'text-emerald-400') : 'text-red-400'}`}>
                {card.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{card.change}</span>
                <span className="text-white/30">较上月</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 card-dark p-5">
          <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            今日待办
          </h3>
          <div className="space-y-3">
            {todoItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 p-3 rounded-lg bg-dark-800/50 hover:bg-dark-700/50 cursor-pointer transition-colors group"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_COLORS[item.priority]}`} />
                <span className="flex-1 text-sm text-white/70 group-hover:text-white/90 transition-colors">{item.label}</span>
                <span className="flex items-center gap-1.5">
                  {item.icon}
                  <span className="font-mono text-sm text-amber-400">{item.count}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              商铺状态概览
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-36 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={shopStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {shopStatusData.map((entry) => (
                        <Cell key={entry.name} fill={SHOP_STATUS_COLORS[entry.name] || '#666'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {shopStatusData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: SHOP_STATUS_COLORS[entry.name] }}
                      />
                      <span className="text-white/60">{entry.name}</span>
                    </span>
                    <span className="font-mono text-white/80">
                      {entry.value}
                      <span className="text-white/30 ml-1">
                        {((entry.value / shops.length) * 100).toFixed(0)}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-8 card-dark p-5">
          <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            近7日客流趋势
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={footTraffic7Days} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F0A500" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F0A500" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                  itemStyle={{ color: '#F0A500' }}
                  formatter={(value: number) => [value.toLocaleString(), '客流量']}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#F0A500"
                  strokeWidth={2.5}
                  dot={{ fill: '#F0A500', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#F0A500', stroke: '#fff', strokeWidth: 2 }}
                  fill="url(#trafficGradient)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card-dark p-5">
        <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          最近告警
        </h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {recentAlerts.map((alert, i) => {
            const cfg = ALERT_CONFIG[alert.type] || { color: 'text-gray-400', icon: <AlertCircle className="w-4 h-4" /> }
            const isActive = alert.status === '未处理' || alert.status === '待处置' || alert.status === '处理中' || alert.status === '处置中'
            return (
              <div
                key={i}
                className={`flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-dark-800/50 transition-colors ${isActive ? 'bg-dark-800/30' : ''}`}
              >
                <span className={`shrink-0 ${cfg.color} ${isActive ? 'animate-pulse' : 'opacity-60'}`}>
                  {cfg.icon}
                </span>
                <span className="text-xs text-white/30 font-mono shrink-0">{alert.time.slice(5)}</span>
                <span className={`text-sm truncate ${isActive ? 'text-white/80' : 'text-white/50'}`}>
                  {alert.desc}
                </span>
                {isActive && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 shrink-0">
                    {alert.status}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  )
}
