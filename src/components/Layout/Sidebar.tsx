import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Car,
  Shield,
  SprayCan,
  Zap,
  Megaphone,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: '总览仪表盘', icon: LayoutDashboard },
  { path: '/shops', label: '商铺租赁', icon: Building2 },
  { path: '/operations', label: '运营方案', icon: CalendarDays },
  { path: '/parking', label: '停车场', icon: Car },
  { path: '/security', label: '安保排班', icon: Shield },
  { path: '/cleaning', label: '保洁排班', icon: SprayCan },
  { path: '/energy', label: '能耗监控', icon: Zap },
  { path: '/advertising', label: '广告位', icon: Megaphone },
  { path: '/statistics', label: '统计报表', icon: BarChart3 },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-dark-800 text-white transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[240px]'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-sm font-bold text-dark-900">
              商
            </div>
            <span className="text-base font-semibold tracking-wide">商业综合体</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white',
            collapsed && 'mx-auto'
          )}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-amber-500/15 text-amber-500'
                      : 'text-white/60 hover:bg-white/8 hover:text-white'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    size={20}
                    className={cn(
                      'shrink-0 transition-colors',
                      isActive ? 'text-amber-500' : 'text-white/50 group-hover:text-white/80'
                    )}
                  />
                  {!collapsed && <span>{item.label}</span>}
                  {isActive && !collapsed && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5',
            collapsed ? 'justify-center' : ''
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dark-600">
            <User size={16} className="text-white/70" />
          </div>
          {!collapsed && (
            <div className="flex flex-1 items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">王建国</p>
                <p className="text-xs text-white/40">系统管理员</p>
              </div>
              <button className="text-white/30 transition-colors hover:text-white/70">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
