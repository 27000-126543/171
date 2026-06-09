import type { FootTrafficData } from '@/types'

export const footTrafficData: FootTrafficData[] = [
  {
    id: 'FT001',
    floor: '1F',
    area: '中庭',
    count: 1250,
    timestamp: '2025-06-09 14:00',
    date: '2025-06-09',
    hour: 14,
  },
  {
    id: 'FT002',
    floor: '1F',
    area: '入口A',
    count: 890,
    timestamp: '2025-06-09 14:00',
    date: '2025-06-09',
    hour: 14,
  },
  {
    id: 'FT003',
    floor: '1F',
    area: '入口B',
    count: 760,
    timestamp: '2025-06-09 14:00',
    date: '2025-06-09',
    hour: 14,
  },
  {
    id: 'FT004',
    floor: '2F',
    area: 'A区',
    count: 680,
    timestamp: '2025-06-09 14:00',
    date: '2025-06-09',
    hour: 14,
  },
  {
    id: 'FT005',
    floor: '2F',
    area: 'B区',
    count: 520,
    timestamp: '2025-06-09 14:00',
    date: '2025-06-09',
    hour: 14,
  },
  {
    id: 'FT006',
    floor: '3F',
    area: '儿童区',
    count: 950,
    timestamp: '2025-06-09 14:00',
    date: '2025-06-09',
    hour: 14,
  },
  {
    id: 'FT007',
    floor: '3F',
    area: '健身区',
    count: 280,
    timestamp: '2025-06-09 14:00',
    date: '2025-06-09',
    hour: 14,
  },
  {
    id: 'FT008',
    floor: '4F',
    area: '影院',
    count: 1100,
    timestamp: '2025-06-09 14:00',
    date: '2025-06-09',
    hour: 14,
  },
  {
    id: 'FT009',
    floor: '4F',
    area: '餐饮区',
    count: 1450,
    timestamp: '2025-06-09 14:00',
    date: '2025-06-09',
    hour: 14,
  },
  {
    id: 'FT010',
    floor: '5F',
    area: '美容区',
    count: 320,
    timestamp: '2025-06-09 14:00',
    date: '2025-06-09',
    hour: 14,
  },
  {
    id: 'FT011',
    floor: 'B1',
    area: '车库通道',
    count: 450,
    timestamp: '2025-06-09 14:00',
    date: '2025-06-09',
    hour: 14,
  },
  {
    id: 'FT012',
    floor: '1F',
    area: '中庭',
    count: 980,
    timestamp: '2025-06-09 12:00',
    date: '2025-06-09',
    hour: 12,
  },
  {
    id: 'FT013',
    floor: '4F',
    area: '餐饮区',
    count: 1800,
    timestamp: '2025-06-09 12:00',
    date: '2025-06-09',
    hour: 12,
  },
  {
    id: 'FT014',
    floor: '1F',
    area: '入口A',
    count: 650,
    timestamp: '2025-06-09 10:00',
    date: '2025-06-09',
    hour: 10,
  },
  {
    id: 'FT015',
    floor: '3F',
    area: '儿童区',
    count: 1100,
    timestamp: '2025-06-09 15:00',
    date: '2025-06-09',
    hour: 15,
  },
]

export const hourlyFootTraffic = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 8
  const base = hour >= 11 && hour <= 14 ? 8000 : hour >= 17 && hour <= 20 ? 7500 : 4000
  return {
    hour: `${String(hour).padStart(2, '0')}:00`,
    count: Math.round(base + Math.random() * 2000),
  }
})

export const dailyFootTraffic = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2025, 5, i + 1)
  const dayOfWeek = date.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const base = isWeekend ? 45000 : 30000
  return {
    date: `${date.getMonth() + 1}/${date.getDate()}`,
    count: Math.round(base + Math.random() * 10000),
    weekday: isWeekend ? '周末' : '工作日',
  }
})

export const floorTrafficSummary = [
  { floor: '1F', count: 8200, ratio: 28.5 },
  { floor: '2F', count: 4800, ratio: 16.7 },
  { floor: '3F', count: 5600, ratio: 19.4 },
  { floor: '4F', count: 7200, ratio: 25.0 },
  { floor: '5F', count: 1800, ratio: 6.3 },
  { floor: 'B1', count: 1200, ratio: 4.2 },
]

export const categoryTrafficSummary = [
  { category: '餐饮', count: 12600, ratio: 30.0 },
  { category: '零售', count: 8900, ratio: 21.2 },
  { category: '娱乐', count: 7200, ratio: 17.1 },
  { category: '儿童', count: 5500, ratio: 13.1 },
  { category: '数码', count: 3200, ratio: 7.6 },
  { category: '美容健身', count: 2800, ratio: 6.7 },
  { category: '其他', count: 1800, ratio: 4.3 },
]

export const monthlyRevenueTrend = Array.from({ length: 12 }, (_, i) => {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  return {
    month: months[i],
    rent: Math.round(280 + Math.random() * 60),
    parking: Math.round(35 + Math.random() * 15),
    advertising: Math.round(18 + Math.random() * 8),
    other: Math.round(8 + Math.random() * 5),
  }
})

export const kpiSummary = {
  occupancyRate: 86.7,
  monthlyRevenue: 385.6,
  totalTraffic: 28800,
  alarmCount: 5,
  pendingApproval: 4,
  overdueBills: 2,
  parkingUsage: 73.3,
}
