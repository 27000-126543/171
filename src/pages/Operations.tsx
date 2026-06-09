import { useState, useEffect } from 'react'
import {
  CalendarDays, Filter, Plus, Eye, CheckCircle2, XCircle,
  Send, Play, FileCheck, Clock, ChevronDown, X, Loader2,
  AlertTriangle, Sparkles, MessageSquare
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useOperationStore } from '@/stores/operationStore'
import type { OperationPlan } from '@/types'

const typeConfig: Record<OperationPlan['type'], { color: string; bg: string; border: string }> = {
  '常规方案': { color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  '节假日方案': { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  '促销方案': { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  '应急方案': { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
}

const statusConfig: Record<OperationPlan['status'], { color: string; bg: string; icon: React.ReactNode }> = {
  '待审批': { color: 'text-amber-400', bg: 'bg-amber-500/15', icon: <Clock size={12} /> },
  '已通过': { color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: <CheckCircle2 size={12} /> },
  '已驳回': { color: 'text-red-400', bg: 'bg-red-500/15', icon: <XCircle size={12} /> },
  '执行中': { color: 'text-blue-400', bg: 'bg-blue-500/15', icon: <Play size={12} /> },
  '已完成': { color: 'text-white/50', bg: 'bg-white/10', icon: <FileCheck size={12} /> },
}

const workflowSteps = ['待审批', '已通过', '执行中', '已完成']

function getWorkflowStepIndex(status: OperationPlan['status']): number {
  if (status === '已驳回') return -1
  return workflowSteps.indexOf(status)
}

const planTypeOptions: OperationPlan['type'][] = ['常规方案', '节假日方案', '促销方案', '应急方案']
const statusOptions: OperationPlan['status'][] = ['待审批', '已通过', '已驳回', '执行中', '已完成']

const contentTemplates: Record<OperationPlan['type'], { businessHours: string; promotion: string; routeOptimization: string }> = {
  '常规方案': {
    businessHours: '营业时间 10:00-22:00，各区域按标准人员配置',
    promotion: '无特殊促销活动，维持日常营销节奏',
    routeOptimization: '常规巡逻路线，保洁频次每2小时一次',
  },
  '节假日方案': {
    businessHours: '营业时间延长至 23:00，增加安保人员3名',
    promotion: '节假日主题活动，餐饮区增加桌椅，重点商铺备货',
    routeOptimization: 'B1层增设临时导引岗，保洁频次提升至每小时一次',
  },
  '促销方案': {
    businessHours: '营业时间 10:00-23:00，重点区域增派安保2名驻场',
    promotion: '中庭搭建促销展台，LED大屏投放促销广告，全场满减活动',
    routeOptimization: '1F巡屏频次加倍，停车场临时免费1小时',
  },
  '应急方案': {
    businessHours: '根据实际情况调整，可能提前结束营业',
    promotion: '暂停一切促销活动，优先保障人员安全',
    routeOptimization: '各入口铺设防滑垫，地下车库入口设置挡水板，实时监控积水',
  },
}

export default function Operations() {
  const { plans, addPlan, updatePlan } = useOperationStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [selectedDate, setSelectedDate] = useState(today)
  const [typeFilter, setTypeFilter] = useState<OperationPlan['type'] | '全部'>('全部')
  const [statusFilter, setStatusFilter] = useState<OperationPlan['status'] | '全部'>('全部')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<OperationPlan | null>(null)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genDate, setGenDate] = useState(today)
  const [genType, setGenType] = useState<OperationPlan['type']>('常规方案')
  const [approvalComment, setApprovalComment] = useState('')

  useEffect(() => {
    const handler = () => {
      setShowTypeDropdown(false)
      setShowStatusDropdown(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const filteredPlans = plans.filter((p) => {
    if (typeFilter !== '全部' && p.type !== typeFilter) return false
    if (statusFilter !== '全部' && p.status !== statusFilter) return false
    return true
  }).sort((a, b) => b.planDate.localeCompare(a.planDate))

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      const template = contentTemplates[genType]
      const newPlan: OperationPlan = {
        id: `OP${String(plans.length + 1).padStart(3, '0')}`,
        planDate: genDate,
        type: genType,
        content: `${template.businessHours}；${template.promotion}；${template.routeOptimization}`,
        status: '待审批',
        approvedBy: '',
        approvedAt: '',
        createdAt: `${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
      }
      addPlan(newPlan)
      setGenerating(false)
      setShowGenerateDialog(false)
    }, 2000)
  }

  const handleApprove = (plan: OperationPlan, approved: boolean) => {
    updatePlan(plan.id, {
      status: approved ? '已通过' : '已驳回',
      approvedBy: '王建国',
      approvedAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
    })
    setSelectedPlan(null)
    setApprovalComment('')
  }

  const handleAction = (plan: OperationPlan, action: string) => {
    if (action === '推送') {
      updatePlan(plan.id, { status: '执行中' })
    } else if (action === '完成') {
      updatePlan(plan.id, { status: '已完成' })
    }
  }

  const getActionButtons = (plan: OperationPlan) => {
    switch (plan.status) {
      case '待审批':
        return (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handleApprove(plan, true) }}
              className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30"
            >
              <CheckCircle2 size={13} /> 审批
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan) }}
              className="flex items-center gap-1 rounded-lg bg-white/8 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/12 hover:text-white/80"
            >
              <Eye size={13} /> 查看
            </button>
          </>
        )
      case '已通过':
        return (
          <button
            onClick={(e) => { e.stopPropagation(); handleAction(plan, '推送') }}
            className="flex items-center gap-1 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/30"
          >
            <Send size={13} /> 推送
          </button>
        )
      case '执行中':
        return (
          <button
            onClick={(e) => { e.stopPropagation(); handleAction(plan, '完成') }}
            className="flex items-center gap-1 rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/30"
          >
            <FileCheck size={13} /> 完成
          </button>
        )
      case '已驳回':
        return (
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan) }}
            className="flex items-center gap-1 rounded-lg bg-white/8 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/12"
          >
            <Eye size={13} /> 查看
          </button>
        )
      case '已完成':
        return (
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan) }}
            className="flex items-center gap-1 rounded-lg bg-white/8 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/12"
          >
            <Eye size={13} /> 查看
          </button>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center gap-4">
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
          onClick={() => setShowGenerateDialog(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-dark-900 transition-all hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20"
        >
          <Plus size={16} />
          生成方案
        </button>

        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowTypeDropdown(!showTypeDropdown); setShowStatusDropdown(false) }}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-dark-800/60 px-3 py-2 text-sm text-white/70 transition-colors hover:border-white/20"
          >
            <Filter size={14} />
            {typeFilter === '全部' ? '方案类型' : typeFilter}
            <ChevronDown size={14} />
          </button>
          {showTypeDropdown && (
            <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-white/10 bg-dark-800 py-1 shadow-xl animate-fade-in">
              <button onClick={() => { setTypeFilter('全部'); setShowTypeDropdown(false) }} className={`w-full px-3 py-2 text-left text-sm hover:bg-white/8 ${typeFilter === '全部' ? 'text-amber-500' : 'text-white/70'}`}>全部</button>
              {planTypeOptions.map((t) => (
                <button key={t} onClick={() => { setTypeFilter(t); setShowTypeDropdown(false) }} className={`w-full px-3 py-2 text-left text-sm hover:bg-white/8 ${typeFilter === t ? 'text-amber-500' : 'text-white/70'}`}>{t}</button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowStatusDropdown(!showStatusDropdown); setShowTypeDropdown(false) }}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-dark-800/60 px-3 py-2 text-sm text-white/70 transition-colors hover:border-white/20"
          >
            <Filter size={14} />
            {statusFilter === '全部' ? '审批状态' : statusFilter}
            <ChevronDown size={14} />
          </button>
          {showStatusDropdown && (
            <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-white/10 bg-dark-800 py-1 shadow-xl animate-fade-in">
              <button onClick={() => { setStatusFilter('全部'); setShowStatusDropdown(false) }} className={`w-full px-3 py-2 text-left text-sm hover:bg-white/8 ${statusFilter === '全部' ? 'text-amber-500' : 'text-white/70'}`}>全部</button>
              {statusOptions.map((s) => (
                <button key={s} onClick={() => { setStatusFilter(s); setShowStatusDropdown(false) }} className={`w-full px-3 py-2 text-left text-sm hover:bg-white/8 ${statusFilter === s ? 'text-amber-500' : 'text-white/70'}`}>{s}</button>
              ))}
            </div>
          )}
        </div>

        <span className="ml-auto text-sm text-white/40">共 {filteredPlans.length} 条方案</span>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredPlans.map((plan) => {
          const tc = typeConfig[plan.type]
          const sc = statusConfig[plan.status]
          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className="card-dark cursor-pointer p-5 transition-all hover:border-white/12 hover:shadow-lg hover:shadow-black/20"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${tc.bg} ${tc.color} ${tc.border}`}>
                  {plan.type === '应急方案' && <AlertTriangle size={12} />}
                  {plan.type}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${sc.bg} ${sc.color}`}>
                  {sc.icon}
                  {plan.status}
                </span>
              </div>

              <div className="mb-2 flex items-center gap-2 text-sm text-white/50">
                <CalendarDays size={13} />
                {plan.planDate}
              </div>

              <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-white/65">
                {plan.content}
              </p>

              {plan.approvedBy && (
                <div className="mb-3 text-xs text-white/35">
                  审批人：{plan.approvedBy} {plan.approvedAt && `· ${plan.approvedAt}`}
                </div>
              )}

              <div className="flex items-center gap-2 border-t border-white/6 pt-3">
                {getActionButtons(plan)}
              </div>
            </div>
          )
        })}
      </div>

      {filteredPlans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-white/30">
          <FileCheck size={48} className="mb-4" />
          <p className="text-lg">暂无运营方案</p>
          <p className="mt-1 text-sm">点击「生成方案」创建新的运营方案</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setSelectedPlan(null); setApprovalComment('') }}>
          <div className="card-dark animate-slide-up relative mx-4 max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setSelectedPlan(null); setApprovalComment('') }} className="absolute right-4 top-4 text-white/40 transition-colors hover:text-white">
              <X size={20} />
            </button>

            <div className="mb-6 flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${typeConfig[selectedPlan.type].bg} ${typeConfig[selectedPlan.type].color} ${typeConfig[selectedPlan.type].border}`}>
                {selectedPlan.type}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${statusConfig[selectedPlan.status].bg} ${statusConfig[selectedPlan.status].color}`}>
                {statusConfig[selectedPlan.status].icon}
                {selectedPlan.status}
              </span>
            </div>

            <h2 className="mb-1 text-xl font-semibold text-white/90">
              {selectedPlan.planDate} {selectedPlan.type}
            </h2>
            <p className="mb-6 text-xs text-white/35">创建于 {selectedPlan.createdAt}</p>

            {/* Content Sections */}
            <div className="mb-6 space-y-4">
              <div className="rounded-lg bg-dark-800/50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-amber-400">🕐 营业时间调整</h3>
                <p className="text-sm leading-relaxed text-white/65">
                  {selectedPlan.type === '常规方案' && '营业时间 10:00-22:00，各区域按标准人员配置，无特殊调整'}
                  {selectedPlan.type === '节假日方案' && '营业时间延长至 23:00，增加安保人员3名，各出入口增派引导员'}
                  {selectedPlan.type === '促销方案' && '营业时间 10:00-23:00，重点区域增派安保2名驻场，1F中庭搭建促销展台'}
                  {selectedPlan.type === '应急方案' && '根据实际情况调整，可能提前结束营业，优先保障人员安全'}
                </p>
              </div>
              <div className="rounded-lg bg-dark-800/50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-emerald-400">🎯 促销活动安排</h3>
                <p className="text-sm leading-relaxed text-white/65">
                  {selectedPlan.type === '常规方案' && '无特殊促销活动，维持日常营销节奏，各商铺正常运营'}
                  {selectedPlan.type === '节假日方案' && '节假日主题活动，餐饮区增加桌椅，重点商铺提前备货，LED大屏播放节日氛围内容'}
                  {selectedPlan.type === '促销方案' && '中庭搭建促销展台，LED大屏投放促销广告，全场满减活动，指定品牌折扣促销'}
                  {selectedPlan.type === '应急方案' && '暂停一切促销活动，优先保障人员安全，关闭户外展台和临时设施'}
                </p>
              </div>
              <div className="rounded-lg bg-dark-800/50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-blue-400">🚶 动线优化建议</h3>
                <p className="text-sm leading-relaxed text-white/65">
                  {selectedPlan.type === '常规方案' && '常规巡逻路线，保洁频次每2小时一次，电梯和扶梯正常维保'}
                  {selectedPlan.type === '节假日方案' && 'B1层增设临时导引岗，保洁频次提升至每小时一次，重点巡查1F和4F'}
                  {selectedPlan.type === '促销方案' && '1F巡屏频次加倍，停车场临时免费1小时，中庭区域设置单向动线'}
                  {selectedPlan.type === '应急方案' && '各入口铺设防滑垫，地下车库入口设置挡水板，实时监控积水情况，紧急疏散通道保持畅通'}
                </p>
              </div>
            </div>

            {/* Workflow Timeline */}
            <div className="mb-6">
              <h3 className="mb-4 text-sm font-semibold text-white/70">审批流程</h3>
              <div className="flex items-center">
                {workflowSteps.map((step, idx) => {
                  const currentIdx = getWorkflowStepIndex(selectedPlan.status)
                  const isCompleted = idx <= currentIdx && currentIdx >= 0
                  const isCurrent = idx === currentIdx
                  const isRejected = selectedPlan.status === '已驳回' && idx === 0
                  return (
                    <div key={step} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                          isCompleted ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40' :
                          isRejected ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/40' :
                          'bg-white/8 text-white/30'
                        } ${isCurrent ? 'scale-110' : ''}`}>
                          {isCompleted ? '✓' : isRejected ? '✗' : idx + 1}
                        </div>
                        <span className={`mt-1 text-xs ${isCompleted ? 'text-emerald-400' : isRejected ? 'text-red-400' : 'text-white/30'}`}>
                          {step}
                        </span>
                      </div>
                      {idx < workflowSteps.length - 1 && (
                        <div className={`mx-1 h-0.5 w-10 ${idx < currentIdx && currentIdx >= 0 ? 'bg-emerald-500/40' : 'bg-white/10'}`} />
                      )}
                    </div>
                  )
                })}
                {selectedPlan.status === '已驳回' && (
                  <div className="ml-3 flex items-center gap-1 rounded-md bg-red-500/15 px-2 py-1 text-xs text-red-400">
                    <XCircle size={12} /> 已驳回
                  </div>
                )}
              </div>
            </div>

            {selectedPlan.approvedBy && (
              <div className="mb-4 rounded-lg border border-white/6 bg-dark-800/30 p-3">
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-500">
                    {selectedPlan.approvedBy[0]}
                  </div>
                  <span className="text-white/70">{selectedPlan.approvedBy}</span>
                  <span>审批于 {selectedPlan.approvedAt}</span>
                  {selectedPlan.status === '已驳回' && (
                    <span className="text-red-400">· 已驳回</span>
                  )}
                </div>
              </div>
            )}

            {/* Approval Panel */}
            {selectedPlan.status === '待审批' && (
              <div className="mt-4 border-t border-white/6 pt-4">
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquare size={14} className="text-white/40" />
                  <span className="text-sm text-white/50">审批意见</span>
                </div>
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="请输入审批意见（可选）..."
                  className="mb-4 w-full rounded-lg border border-white/10 bg-dark-800/50 px-3 py-2 text-sm text-white/80 placeholder-white/25 outline-none transition-colors focus:border-amber-500/40"
                  rows={3}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(selectedPlan, true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500/20 py-2.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30"
                  >
                    <CheckCircle2 size={16} /> 通过
                  </button>
                  <button
                    onClick={() => handleApprove(selectedPlan, false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500/20 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
                  >
                    <XCircle size={16} /> 驳回
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate Plan Dialog */}
      {showGenerateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { if (!generating) setShowGenerateDialog(false) }}>
          <div className="card-dark animate-slide-up relative mx-4 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { if (!generating) setShowGenerateDialog(false) }} className="absolute right-4 top-4 text-white/40 transition-colors hover:text-white">
              <X size={20} />
            </button>

            <div className="mb-5 flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              <h2 className="text-lg font-semibold text-white/90">生成运营方案</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-white/50">选择日期</label>
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-dark-800/50 px-3 py-2.5">
                  <CalendarDays size={16} className="text-amber-500" />
                  <input
                    type="date"
                    value={genDate}
                    onChange={(e) => setGenDate(e.target.value)}
                    className="w-full border-none bg-transparent text-sm text-white/80 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-white/50">方案类型</label>
                <div className="grid grid-cols-2 gap-2">
                  {planTypeOptions.map((t) => (
                    <button
                      key={t}
                      onClick={() => setGenType(t)}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                        genType === t
                          ? `${typeConfig[t].bg} ${typeConfig[t].color} ${typeConfig[t].border}`
                          : 'border-white/8 text-white/50 hover:border-white/15 hover:text-white/70'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-dark-800/50 p-3">
                <p className="mb-1 text-xs text-white/35">将自动生成以下内容：</p>
                <p className="text-xs leading-relaxed text-white/55">
                  {contentTemplates[genType].businessHours}；{contentTemplates[genType].promotion}；{contentTemplates[genType].routeOptimization}
                </p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-dark-900 transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    正在生成方案...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    生成方案
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
