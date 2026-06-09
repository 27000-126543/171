## 1. 架构设计

```mermaid
graph TB
    "前端 React + Vite" --> "状态管理 Zustand"
    "状态管理 Zustand" --> "Mock数据层"
    "前端 React + Vite" --> "路由 React Router"
    "前端 React + Vite" --> "UI组件库"
    "UI组件库" --> "Recharts 图表"
    "UI组件库" --> "TailwindCSS 样式"
    "UI组件库" --> "Lucide Icons"
    "前端 React + Vite" --> "工具层"
    "工具层" --> "日期处理 date-fns"
    "工具层" --> "Excel导出 xlsx"
```

## 2. 技术说明

- **前端框架**：React@18 + TypeScript
- **构建工具**：Vite
- **样式方案**：TailwindCSS@3
- **状态管理**：Zustand（轻量级，适合中型项目）
- **路由**：React Router@6
- **图表库**：Recharts（声明式React图表）
- **图标**：Lucide React
- **日期处理**：date-fns
- **Excel导出**：xlsx(SheetJS)
- **后端**：无后端，使用Mock数据模拟
- **数据存储**：Zustand持久化 + localStorage

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 总览仪表盘 |
| /shops | 商铺租赁管理 |
| /shops/:id | 商铺详情 |
| /operations | 运营方案管理 |
| /parking | 停车场管理 |
| /security | 安保排班 |
| /cleaning | 保洁排班 |
| /energy | 能耗监控 |
| /advertising | 广告位管理 |
| /statistics | 统计报表 |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    "商铺" {
        string id PK
        string number
        number area
        number rentPrice
        string floor
        string category
        string status
        date leaseStart
        date leaseEnd
        string tenantName
        string tenantPhone
    }
    "合同" {
        string id PK
        string shopId FK
        string tenantName
        date startDate
        date endDate
        number monthlyRent
        string status
    }
    "账单" {
        string id PK
        string shopId FK
        string contractId FK
        number amount
        date billDate
        date dueDate
        string status
        date paidDate
    }
    "催缴记录" {
        string id PK
        string billId FK
        date noticeDate
        string type
        string status
    }
    "运营方案" {
        string id PK
        date planDate
        string type
        string content
        string status
        string approvedBy
        date approvedAt
    }
    "停车位" {
        string id PK
        string floor
        string number
        string status
        string vehiclePlate
        date enterTime
        boolean isVip
    }
    "VIP预约" {
        string id PK
        string parkingId FK
        string applicant
        date reserveDate
        string status
    }
    "安保人员" {
        string id PK
        string name
        string phone
        string rank
    }
    "安保排班" {
        string id PK
        string staffId FK
        date shiftDate
        string shift
        string area
        string patrolRoute
    }
    "异常事件" {
        string id PK
        string type
        string location
        date eventTime
        string status
        string assignedTo FK
        string resolution
        date resolvedAt
    }
    "保洁任务" {
        string id PK
        string area
        string level
        string assignee
        date taskDate
        string status
        number deadline
    }
    "能耗数据" {
        string id PK
        string type
        number value
        number threshold
        date timestamp
        string area
    }
    "能耗报警" {
        string id PK
        string energyId FK
        number value
        number threshold
        date alarmTime
        string status
    }
    "广告位" {
        string id PK
        string location
        string type
        string size
        number price
        string status
        date leaseStart
        date leaseEnd
        string client
    }
    "客流数据" {
        string id PK
        string floor
        string area
        number count
        date timestamp
    }
    "商铺" ||--o{ "合同" : "拥有"
    "合同" ||--o{ "账单" : "生成"
    "账单" ||--o{ "催缴记录" : "触发"
    "停车位" ||--o{ "VIP预约" : "关联"
    "安保人员" ||--o{ "安保排班" : "排班"
    "安保人员" ||--o{ "异常事件" : "处置"
    "能耗数据" ||--o{ "能耗报警" : "触发"
```

## 5. 项目目录结构

```
src/
├── components/          # 公共组件
│   ├── Layout/          # 布局组件(侧栏/顶栏/内容区)
│   ├── Charts/          # 图表封装组件
│   ├── StatusBadge/     # 状态标签组件
│   └── Modal/           # 弹窗组件
├── pages/               # 页面组件
│   ├── Dashboard/       # 总览仪表盘
│   ├── Shops/           # 商铺租赁管理
│   ├── Operations/      # 运营方案管理
│   ├── Parking/         # 停车场管理
│   ├── Security/        # 安保排班
│   ├── Cleaning/        # 保洁排班
│   ├── Energy/          # 能耗监控
│   ├── Advertising/     # 广告位管理
│   └── Statistics/      # 统计报表
├── stores/              # Zustand状态管理
│   ├── shopStore.ts
│   ├── parkingStore.ts
│   ├── securityStore.ts
│   ├── cleaningStore.ts
│   ├── energyStore.ts
│   ├── advertisingStore.ts
│   └── operationStore.ts
├── mock/                # Mock数据
│   ├── shops.ts
│   ├── parking.ts
│   ├── security.ts
│   ├── cleaning.ts
│   ├── energy.ts
│   ├── advertising.ts
│   └── statistics.ts
├── utils/               # 工具函数
│   ├── dateUtils.ts
│   ├── excelExport.ts
│   └── calculations.ts
├── types/               # TypeScript类型定义
│   └── index.ts
├── App.tsx
└── main.tsx
```
