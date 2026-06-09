import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Line, Legend, LineChart,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Users, DollarSign, Zap, AlertTriangle,
  Search, Download, MapPin,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { shops } from '@/mock/shops'
import {
  floorTrafficSummary, categoryTrafficSummary, monthlyRevenueTrend,
  footTrafficData,
} from '@/mock/statistics'
import { energyData } from '@/mock/energy'
import { useShopStore } from '@/stores/shopStore'

const FLOORS = ['1F', '2F', '3F', '4F', '5F']
const CATEGORIES = ['餐饮', '零售', '娱乐', '服务', '教育']

const STATUS_COLORS: Record<string, string> = {
  '已出租': '#10B981',
  '空置': '#6B7280',
  '即将到期': '#F59E0B',
  '装修中': '#3B82F6',
}

const CATEGORY_COLORS: Record<string, string> = {
  '餐饮': '#F59E0B',
  '零售': '#10B981',
  '娱乐': '#8B5CF6',
  '服务': '#3B82F6',
  '教育': '#EC4899',
  '珠宝': '#F59E0B',
  '化妆品': '#EC4899',
  '服装': '#10B981',
  '运动': '#06B6D4',
  '数码': '#6366F1',
  '儿童乐园': '#8B5CF6',
  '健身': '#06B6D4',
  '影院': '#8B5CF6',
  '美容美发': '#EC4899',
  '便利店': '#10B981',
  '烘焙': '#F59E0B',
}

const FLOOR_SHOPS: Record<string, Array<{
  id: string; number: string; row: number; col: number;
  rowSpan: number; colSpan: number; category: string;
  status: string; tenantName: string;
}>> = {
  '1F': [
    { id: 'S001', number: '1F-A01', row: 1, col: 1, rowSpan: 2, colSpan: 2, category: '餐饮', status: '已出租', tenantName: '星巴克咖啡' },
    { id: 'S002', number: '1F-A02', row: 1, col: 3, rowSpan: 2, colSpan: 3, category: '零售', status: '已出租', tenantName: '优衣库' },
    { id: 'S003', number: '1F-B01', row: 3, col: 1, rowSpan: 1, colSpan: 2, category: '珠宝', status: '即将到期', tenantName: '周大福珠宝' },
    { id: 'S004', number: '1F-B02', row: 3, col: 3, rowSpan: 1, colSpan: 3, category: '化妆品', status: '已出租', tenantName: '兰蔻专柜' },
    { id: 'CORRIDOR1', number: '', row: 4, col: 1, rowSpan: 1, colSpan: 5, category: '', status: '走廊', tenantName: '' },
    { id: 'ENTRANCE', number: '入口', row: 5, col: 1, rowSpan: 1, colSpan: 2, category: '', status: '通道', tenantName: '主入口A' },
    { id: 'ENTRANCE2', number: '入口', row: 5, col: 4, rowSpan: 1, colSpan: 2, category: '', status: '通道', tenantName: '主入口B' },
    { id: 'ATRIUM', number: '中庭', row: 5, col: 3, rowSpan: 1, colSpan: 1, category: '', status: '通道', tenantName: '中庭' },
  ],
  '2F': [
    { id: 'S005', number: '2F-A01', row: 1, col: 1, rowSpan: 2, colSpan: 3, category: '服装', status: '已出租', tenantName: 'ZARA' },
    { id: 'S006', number: '2F-A02', row: 1, col: 4, rowSpan: 1, colSpan: 2, category: '运动', status: '空置', tenantName: '' },
    { id: 'S007', number: '2F-B01', row: 2, col: 4, rowSpan: 1, colSpan: 2, category: '数码', status: '已出租', tenantName: '华为授权体验店' },
    { id: 'CORRIDOR2', number: '', row: 3, col: 1, rowSpan: 1, colSpan: 5, category: '', status: '走廊', tenantName: '' },
    { id: 'REST1', number: '洗手间', row: 4, col: 1, rowSpan: 1, colSpan: 1, category: '', status: '公共设施', tenantName: '' },
    { id: 'REST2', number: '扶梯', row: 4, col: 3, rowSpan: 1, colSpan: 1, category: '', status: '公共设施', tenantName: '' },
  ],
  '3F': [
    { id: 'S008', number: '3F-A01', row: 1, col: 1, rowSpan: 2, colSpan: 3, category: '儿童乐园', status: '已出租', tenantName: '宝贝王乐园' },
    { id: 'S009', number: '3F-A02', row: 1, col: 4, rowSpan: 2, colSpan: 2, category: '教育', status: '装修中', tenantName: '新东方教育' },
    { id: 'S010', number: '3F-B01', row: 3, col: 1, rowSpan: 1, colSpan: 3, category: '健身', status: '已出租', tenantName: '威尔仕健身' },
    { id: 'CORRIDOR3', number: '', row: 4, col: 1, rowSpan: 1, colSpan: 5, category: '', status: '走廊', tenantName: '' },
  ],
  '4F': [
    { id: 'S011', number: '4F-A01', row: 1, col: 1, rowSpan: 2, colSpan: 3, category: '影院', status: '已出租', tenantName: '万达影城' },
    { id: 'S012', number: '4F-A02', row: 1, col: 4, rowSpan: 2, colSpan: 2, category: '餐饮', status: '已出租', tenantName: '海底捞火锅' },
    { id: 'CORRIDOR4', number: '', row: 3, col: 1, rowSpan: 1, colSpan: 5, category: '', status: '走廊', tenantName: '' },
    { id: 'KITCHEN', number: '后厨区', row: 4, col: 4, rowSpan: 1, colSpan: 2, category: '', status: '公共设施', tenantName: '' },
  ],
  '5F': [
    { id: 'S015', number: '5F-A01', row: 1, col: 1, rowSpan: 2, colSpan: 5, category: '美容美发', status: '即将到期', tenantName: '文峰美发' },
    { id: 'CORRIDOR5', number: '', row: 3, col: 1, rowSpan: 1, colSpan: 5, category: '', status: '走廊', tenantName: '' },
    { id: 'ROOFTOP', number: '天台', row: 4, col: 1, rowSpan: 1, colSpan: 5, category: '', status: '公共设施', tenantName: '' },
  ],
}

const floorTrafficMap: Record<string, number> = {}
floorTrafficSummary.forEach((f) => { floorTrafficMap[f.floor] = f.count })
footTrafficData.forEach((f) => {
  floorTrafficMap[f.floor] = (floorTrafficMap[f.floor] || 0) + f.count
})

const maxTraffic = Math.max(...Object.values(floorTrafficMap), 1)

function getTrafficIntensity(floor: string): number {
  const traffic = floorTrafficMap[floor] || 0
  return traffic / maxTraffic
}

function getHeatmapOverlay(intensity: number): React.CSSProperties {
  if (intensity > 0.7) {
    return {
      background: `radial-gradient(ellipse at center, rgba(239,68,68,${0.15 + intensity * 0.2}) 0%, rgba(249,115,22,${0.1 + intensity * 0.15}) 50%, transparent 80%)`,
    }
  }
  if (intensity > 0.4) {
    return {
      background: `radial-gradient(ellipse at center, rgba(249,115,22,${0.1 + intensity * 0.15}) 0%, rgba(245,158,11,${0.05 + intensity * 0.1}) 50%, transparent 80%)`,
    }
  }
  return {
    background: `radial-gradient(ellipse at center, rgba(59,130,246,${0.05 + intensity * 0.1}) 0%, rgba(16,185,129,${0.03 + intensity * 0.08}) 50%, transparent 80%)`,
  }
}

function getShopHeatColor(status: string, traffic: number): string {
  const baseColor = STATUS_COLORS[status] || '#6B7280'
  const intensity = Math.min(traffic / maxTraffic, 1)
  const alpha = 0.3 + intensity * 0.7
  if (status === '空置' || status === '走廊' || status === '通道' || status === '公共设施') return baseColor
  return baseColor + Math.round(alpha * 255).toString(16).padStart(2, '0')
}

const revenueTrendData = monthlyRevenueTrend.slice(0, 6).map((item, i) => ({
  month: item.month,
  本年: item.rent,
  去年: Math.round(item.rent * (0.85 + Math.random() * 0.1)),
}))

const energyByArea = [
  { area: '1F', electricity: 2850, water: 45, gas: 85, total: 2850 + 45 + 85 },
  { area: '2F', electricity: 2100, water: 38, gas: 0, total: 2100 + 38 },
  { area: '3F', electricity: 3200, water: 55, gas: 0, total: 3200 + 55 },
  { area: '4F', electricity: 1800, water: 62, gas: 120, total: 1800 + 62 + 120 },
  { area: '5F', electricity: 900, water: 28, gas: 0, total: 900 + 28 },
  { area: 'B1', electricity: 1600, water: 0, gas: 0, total: 1600 },
]

const complaintRateData = [
  { month: '1月', 餐饮: 2.1, 零售: 1.5, 娱乐: 0.8, 服务: 1.2 },
  { month: '2月', 餐饮: 1.8, 零售: 1.3, 娱乐: 1.0, 服务: 1.6 },
  { month: '3月', 餐饮: 2.5, 零售: 1.1, 娱乐: 0.6, 服务: 1.0 },
  { month: '4月', 餐饮: 1.9, 零售: 1.7, 娱乐: 1.2, 服务: 0.9 },
  { month: '5月', 餐饮: 2.3, 零售: 1.0, 娱乐: 0.9, 服务: 1.4 },
  { month: '6月', 餐饮: 1.6, 零售: 0.8, 娱乐: 0.7, 服务: 1.1 },
]

const kpiData = [
  {
    label: '月度客流总计',
    value: '28,800',
    yoy: '+12.5%',
    mom: '+3.2%',
    yoyUp: true,
    momUp: true,
    icon: <Users className="w-5 h-5 text-amber-400" />,
    accent: 'from-amber-500/20 to-amber-500/5',
  },
  {
    label: '月度租金收入',
    value: '¥385.6万',
    yoy: '+8.3%',
    mom: '+1.7%',
    yoyUp: true,
    momUp: true,
    icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
    accent: 'from-emerald-500/20 to-emerald-500/5',
  },
  {
    label: '月度能耗费用',
    value: '¥42.8万',
    yoy: '+5.1%',
    mom: '-2.4%',
    yoyUp: true,
    momUp: false,
    icon: <Zap className="w-5 h-5 text-blue-400" />,
    accent: 'from-blue-500/20 to-blue-500/5',
  },
  {
    label: '月度投诉率',
    value: '1.35%',
    yoy: '-0.8%',
    mom: '+0.2%',
    yoyUp: false,
    momUp: true,
    icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
    accent: 'from-red-500/20 to-red-500/5',
  },
]

const floorCategoryData = FLOORS.map((floor) => {
  const row: Record<string, string | number> = { floor }
  const floorShops = shops.filter((s) => s.floor === floor)
  CATEGORIES.forEach((cat) => {
    const catShops = floorShops.filter(
      (s) => s.category === cat || (cat === '娱乐' && ['影院', '儿童乐园'].includes(s.category)) || (cat === '服务' && ['美容美发', '健身'].includes(s.category)) || (cat === '教育' && s.category === '教育')
    )
    const area = catShops.reduce((sum, s) => sum + s.area, 0)
    const trafficRatio = floorTrafficMap[floor] ? (area / (floorShops.reduce((s, sh) => s + sh.area, 1) || 1)) * floorTrafficMap[floor] : 0
    row[cat] = Math.round(trafficRatio)
  })
  return row
})

const tooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  fontSize: 12,
}

export default function Statistics() {
  const [selectedFloor, setSelectedFloor] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [startDate, setStartDate] = useState('2025-01-01')
  const [endDate, setEndDate] = useState('2025-06-30')
  const [floorTab, setFloorTab] = useState('1F')
  const [hoveredShop, setHoveredShop] = useState<string | null>(null)
  const { contracts, bills } = useShopStore()

  const currentFloorShops = FLOOR_SHOPS[floorTab] || []
  const gridRows = useMemo(() => {
    let maxRow = 0
    currentFloorShops.forEach((s) => {
      if (s.row + s.rowSpan > maxRow) maxRow = s.row + s.rowSpan
    })
    return maxRow
  }, [currentFloorShops])

  const handleExport = () => {
    const wb = XLSX.utils.book_new()

    const trafficSheet = XLSX.utils.json_to_sheet(
      floorTrafficSummary.map((f) => ({
        楼层: f.floor,
        客流量: f.count,
        占比: `${f.ratio}%`,
      }))
    )
    XLSX.utils.book_append_sheet(wb, trafficSheet, '客流统计')

    const revenueSheet = XLSX.utils.json_to_sheet(
      monthlyRevenueTrend.map((m) => ({
        月份: m.month,
        租金收入_万元: m.rent,
        停车场收入_万元: m.parking,
        广告收入_万元: m.advertising,
        其他收入_万元: m.other,
      }))
    )
    XLSX.utils.book_append_sheet(wb, revenueSheet, '租金收入')

    const energySheet = XLSX.utils.json_to_sheet(
      energyData.map((e) => ({
        区域: e.area,
        类型: e.type,
        用量: e.value,
        单位: e.unit,
        阈值: e.threshold,
        超限: e.value > e.threshold ? '是' : '否',
      }))
    )
    XLSX.utils.book_append_sheet(wb, energySheet, '能耗统计')

    const complaintSheet = XLSX.utils.json_to_sheet(
      complaintRateData.map((c) => ({
        月份: c.month,
        餐饮投诉率: c.餐饮,
        零售投诉率: c.零售,
        娱乐投诉率: c.娱乐,
        服务投诉率: c.服务,
      }))
    )
    XLSX.utils.book_append_sheet(wb, complaintSheet, '投诉统计')

    XLSX.writeFile(wb, `月度统计报表_${startDate}_${endDate}.xlsx`)
  }

  const floorIntensity = getTrafficIntensity(floorTab)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="card-dark p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-amber-500/50"
          >
            <option value="">全部楼层</option>
            {FLOORS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-amber-500/50"
          >
            <option value="">全部业态</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-amber-500/50"
          />
          <span className="text-white/30">至</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-amber-500/50"
          />
          <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-dark-900 font-medium px-4 py-2 rounded-lg text-sm transition-colors">
            <Search className="w-4 h-4" />
            查询
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-dark-900 font-medium px-4 py-2 rounded-lg text-sm transition-colors ml-auto"
          >
            <Download className="w-4 h-4" />
            导出Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {kpiData.map((card) => (
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
              <div className="font-mono text-3xl font-medium tracking-tight text-white/90 mb-2">
                {card.value}
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  {card.yoyUp ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-emerald-400" />}
                  <span className={card.yoyUp ? 'text-emerald-400' : 'text-emerald-400'}>
                    同比 {card.yoy}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  {card.momUp ? <TrendingUp className="w-3 h-3 text-amber-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
                  <span className={card.momUp ? 'text-amber-400' : 'text-red-400'}>
                    环比 {card.mom}
                  </span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6 card-dark p-5">
          <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" />
            楼层客流对比
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={floorCategoryData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="floor" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'rgba(255,255,255,0.6)' }} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }} />
                {CATEGORIES.map((cat) => (
                  <Bar key={cat} dataKey={cat} stackId="a" fill={CATEGORY_COLORS[cat] || '#6B7280'} radius={[0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-6 card-dark p-5">
          <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500" />
            租金收入趋势
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickFormatter={(v: number) => `${v}万`} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'rgba(255,255,255,0.6)' }} formatter={(v: number) => [`${v}万`]} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }} />
                <Bar dataKey="本年" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={28} />
                <Line type="monotone" dataKey="去年" stroke="#6366F1" strokeWidth={2.5} dot={{ fill: '#6366F1', r: 3, strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6 card-dark p-5">
          <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            各区域能耗统计
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyByArea} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <YAxis dataKey="area" type="category" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'rgba(255,255,255,0.6)' }} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }} />
                <Bar dataKey="electricity" name="用电(kWh)" fill="#F59E0B" stackId="a" />
                <Bar dataKey="water" name="用水(吨)" fill="#3B82F6" stackId="a" />
                <Bar dataKey="gas" name="用气(m³)" fill="#EF4444" stackId="a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-6 card-dark p-5">
          <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            投诉率趋势
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={complaintRateData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'rgba(255,255,255,0.6)' }} formatter={(v: number) => [`${v}%`]} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }} />
                <Line type="monotone" dataKey="餐饮" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', r: 3 }} />
                <Line type="monotone" dataKey="零售" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} />
                <Line type="monotone" dataKey="娱乐" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6', r: 3 }} />
                <Line type="monotone" dataKey="服务" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card-dark p-5">
        <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-500" />
          楼层平面可视化
        </h3>

        <div className="flex items-center gap-2 mb-4">
          {FLOORS.map((f) => (
            <button
              key={f}
              onClick={() => setFloorTab(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                floorTab === f
                  ? 'bg-amber-500 text-dark-900'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative rounded-xl overflow-hidden border border-white/10" style={{ minHeight: 320 }}>
          <div
            className="absolute inset-0 pointer-events-none z-10 transition-all duration-500"
            style={getHeatmapOverlay(floorIntensity)}
          />
          <div
            className="grid gap-1.5 p-4 relative z-0"
            style={{
              gridTemplateColumns: 'repeat(5, 1fr)',
              gridTemplateRows: `repeat(${gridRows}, minmax(48px, auto))`,
            }}
          >
            {currentFloorShops.map((shop) => {
              const isSpecial = ['走廊', '通道', '公共设施'].includes(shop.status)
              const traffic = floorTrafficMap[floorTab] || 0
              const shopTraffic = isSpecial ? 0 : Math.round((traffic / (currentFloorShops.filter((s) => !['走廊', '通道', '公共设施'].includes(s.status)).length || 1)) * (0.5 + Math.random() * 1))
              const heatColor = isSpecial ? 'transparent' : getShopHeatColor(shop.status, shopTraffic)
              const isHovered = hoveredShop === shop.id

              return (
                <div
                  key={shop.id}
                  className={`relative rounded-lg flex items-center justify-center text-center transition-all duration-300 ${
                    isSpecial
                      ? shop.status === '走廊'
                        ? 'bg-white/5 border border-dashed border-white/10'
                        : shop.status === '通道'
                          ? 'bg-blue-500/10 border border-blue-500/20'
                          : 'bg-white/3 border border-white/8'
                      : 'border cursor-pointer hover:scale-[1.02] hover:z-20 hover:shadow-lg'
                  } ${isHovered ? 'ring-2 ring-amber-500/60 z-20 scale-[1.02]' : ''}`}
                  style={{
                    gridRow: `${shop.row} / span ${shop.rowSpan}`,
                    gridColumn: `${shop.col} / span ${shop.colSpan}`,
                    backgroundColor: isSpecial ? undefined : heatColor,
                    borderColor: isSpecial ? undefined : STATUS_COLORS[shop.status] || 'rgba(255,255,255,0.1)',
                  }}
                  onMouseEnter={() => setHoveredShop(shop.id)}
                  onMouseLeave={() => setHoveredShop(null)}
                >
                  {isSpecial ? (
                    <span className="text-xs text-white/30">{shop.tenantName || shop.number}</span>
                  ) : (
                    <>
                      <div className="px-2 py-1">
                        <div className="text-xs font-mono text-white/90 font-medium">{shop.number}</div>
                        {shop.tenantName && (
                          <div className="text-[10px] text-white/50 mt-0.5 truncate max-w-[120px]">{shop.tenantName}</div>
                        )}
                      </div>
                      {isHovered && (
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-30 bg-slate-900 border border-white/20 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                          <div className="text-xs font-medium text-white/90">{shop.number}</div>
                          <div className="text-[10px] text-white/60">租户: {shop.tenantName || '无'}</div>
                          <div className="text-[10px] text-amber-400">客流: {shopTraffic.toLocaleString()}</div>
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-slate-900 border-r border-b border-white/20 rotate-45" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>

          <div className="absolute top-3 right-3 z-20 rounded-lg bg-dark-900/80 backdrop-blur-sm border border-white/10 px-3 py-2">
            <div className="text-[10px] text-white/40 mb-1">客流热力</div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-blue-500/30" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500/50" />
              <div className="w-3 h-3 rounded-sm bg-amber-500/70" />
              <div className="w-3 h-3 rounded-sm bg-orange-500/80" />
              <div className="w-3 h-3 rounded-sm bg-red-500/90" />
              <span className="text-[10px] text-white/40 ml-1">低→高</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-4 justify-center">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-xs text-white/50">{status}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 ml-4">
            <div className="w-8 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, rgba(59,130,246,0.3), rgba(245,158,11,0.5), rgba(239,68,68,0.8))' }} />
            <span className="text-xs text-white/50">客流密度</span>
          </div>
        </div>
      </div>
    </div>
  )
}
