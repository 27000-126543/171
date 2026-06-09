import { Outlet } from 'react-router-dom'
import { Bell, ChevronRight } from 'lucide-react'
import Sidebar from './Sidebar'
import { useLocation } from 'react-router-dom'

const breadcrumbMap: Record<string, string> = {
  '/': '总览仪表盘',
  '/shops': '商铺租赁',
  '/operations': '运营方案',
  '/parking': '停车场',
  '/security': '安保排班',
  '/cleaning': '保洁排班',
  '/energy': '能耗监控',
  '/advertising': '广告位',
  '/statistics': '统计报表',
}

export default function MainLayout() {
  const location = useLocation()
  const currentPage = breadcrumbMap[location.pathname] || '未知页面'

  return (
    <div className="flex h-screen bg-dark-900">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-white/8 bg-dark-800/60 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/40">首页</span>
            <ChevronRight size={14} className="text-white/20" />
            <span className="font-medium text-white/80">{currentPage}</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/8 hover:text-white">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-500">
                王
              </div>
              <span className="text-sm text-white/70">王建国</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
