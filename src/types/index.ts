export interface Shop {
  id: string
  number: string
  area: number
  rentPrice: number
  floor: string
  category: string
  status: '已出租' | '空置' | '即将到期' | '装修中'
  leaseStart: string
  leaseEnd: string
  tenantName: string
  tenantPhone: string
}

export interface Contract {
  id: string
  shopId: string
  tenantName: string
  startDate: string
  endDate: string
  monthlyRent: number
  deposit: number
  status: '生效中' | '已到期' | '待签署' | '已终止'
}

export interface Bill {
  id: string
  shopId: string
  contractId: string
  amount: number
  billDate: string
  dueDate: string
  status: '已缴' | '未缴' | '逾期' | '部分缴纳'
  paidDate: string
  paidAmount: number
  contractVersion?: number
}

export interface CollectionRecord {
  id: string
  billId: string
  noticeDate: string
  type: '短信' | '电话' | '书面' | '上门'
  status: '已通知' | '已回应' | '未回应'
}

export interface OperationPlan {
  id: string
  planDate: string
  type: '常规方案' | '节假日方案' | '促销方案' | '应急方案'
  content: string
  status: '待审批' | '已通过' | '已驳回' | '执行中' | '已完成'
  approvedBy: string
  approvedAt: string
  createdAt: string
}

export interface ParkingSpot {
  id: string
  floor: string
  number: string
  status: '空闲' | '占用' | '预留' | '维护中'
  vehiclePlate: string
  enterTime: string
  isVip: boolean
}

export interface ParkingReminder {
  id: string
  spotId: string
  vehiclePlate: string
  reminderTime: string
  fee: number
  status: '已发送' | '已读' | '未读'
}

export interface VipReservation {
  id: string
  parkingId: string
  applicant: string
  phone: string
  reserveDate: string
  reserveTime: string
  duration: number
  status: '待审批' | '已批准' | '已拒绝' | '已完成'
}

export interface SecurityStaff {
  id: string
  name: string
  phone: string
  rank: '主管' | '班长' | '队员'
  area: string
  status: '在岗' | '休息' | '请假'
}

export interface SecurityShift {
  id: string
  staffId: string
  staffName: string
  shiftDate: string
  shift: '白班' | '中班' | '夜班'
  area: string
  patrolRoute: string
}

export interface IncidentEvent {
  id: string
  type: '火警' | '盗窃' | '冲突' | '设备故障' | '人员受伤' | '非法入侵'
  location: string
  eventTime: string
  status: '待处置' | '处置中' | '已处置' | '已归档'
  assignedTo: string
  description: string
  resolution: string
  resolvedAt: string
}

export interface CleaningEscalation {
  id: string
  taskId: string
  escalateTime: string
  reason: string
  operator: string
}

export interface CleaningTask {
  id: string
  area: string
  floor: string
  level: '一级' | '二级' | '三级'
  assignee: string
  taskDate: string
  status: '待执行' | '进行中' | '已完成' | '超时'
  deadline: number
  completedAt: string
}

export interface EnergyData {
  id: string
  type: '电' | '水' | '气'
  value: number
  threshold: number
  timestamp: string
  area: string
  unit: string
}

export interface EnergyAlarm {
  id: string
  energyId: string
  energyType: '电' | '水' | '气'
  value: number
  threshold: number
  alarmTime: string
  status: '未处理' | '处理中' | '已处理'
  handler: string
  handledAt: string
}

export interface AdSpace {
  id: string
  location: string
  type: 'LED大屏' | '灯箱' | '立牌' | '吊旗' | '电梯广告' | '地贴'
  size: string
  price: number
  status: '已出租' | '空置' | '即将到期' | '维护中'
  leaseStart: string
  leaseEnd: string
  client: string
  contactPhone: string
}

export interface AdNotification {
  id: string
  adSpaceId: string
  location: string
  type: '到期下架' | '到期提醒' | '新租通知'
  message: string
  notifyTime: string
  target: string
  status: '已发送' | '已读'
}

export interface FootTrafficData {
  id: string
  floor: string
  area: string
  count: number
  timestamp: string
  date: string
  hour: number
}

export interface WorkOrder {
  id: string
  type: '逾期账单' | '超时车辆' | '过期广告' | '超时清洁' | '安保事件'
  sourceId: string
  title: string
  description: string
  status: '待处理' | '处理中' | '已处理'
  createdAt: string
  handler: string
  handledAt: string
  result: string
}

export interface SettlementRecord {
  id: string
  shopId: string
  shopNumber: string
  tenantName: string
  unpaidRent: number
  deposit: number
  depositDeduction: number
  finalAmount: number
  direction: '应退' | '应补'
  settledAt: string
  bills: Array<{ billDate: string; amount: number; status: string }>
}
