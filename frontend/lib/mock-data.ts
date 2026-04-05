// Mock data for SupplySync dashboard

export type ToleranceLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type Flexibility = 'STRICT' | 'MODERATE' | 'FLEXIBLE'
export type PaymentMode = 'Cash' | 'UPI' | 'Cheque'

export interface Vendor {
  id: string
  name: string
  contact: string
  location: string
  commodities: string[]
  outstandingBalance: number
  toleranceLevel: ToleranceLevel
  flexibility: Flexibility
  lastSupplyDate: string
  lastPaymentDate: string
  daysSinceLastPayment: number
}

export interface Commodity {
  id: string
  name: string
  icon: string
  currentStock: number
  maxStock: number
  unit: string
  reorderThreshold: number
  linkedVendors: string[]
}

export interface Transaction {
  id: string
  type: 'supply' | 'payment'
  vendorId: string
  vendorName: string
  amount: number
  date: string
  commodity?: string
  quantity?: number
  mode?: PaymentMode
  balanceAfter: number
}

export interface LedgerEntry {
  id: string
  type: 'supply' | 'payment'
  date: string
  amount: number
  runningBalance: number
  commodity?: string
  quantity?: number
  mode?: PaymentMode
}

export const vendors: Vendor[] = [
  {
    id: 'v1',
    name: 'Ramesh Dairy',
    contact: '+91 98765 43210',
    location: 'Sector 14, Gurugram',
    commodities: ['Milk'],
    outstandingBalance: 8400,
    toleranceLevel: 'LOW',
    flexibility: 'STRICT',
    lastSupplyDate: '2024-01-28',
    lastPaymentDate: '2024-01-20',
    daysSinceLastPayment: 8,
  },
  {
    id: 'v2',
    name: 'Sharma Traders',
    contact: '+91 87654 32109',
    location: 'Mandi Market, Delhi',
    commodities: ['Rice', 'Oil'],
    outstandingBalance: 3200,
    toleranceLevel: 'HIGH',
    flexibility: 'FLEXIBLE',
    lastSupplyDate: '2024-01-27',
    lastPaymentDate: '2024-01-26',
    daysSinceLastPayment: 2,
  },
  {
    id: 'v3',
    name: 'Fresh Farms',
    contact: '+91 76543 21098',
    location: 'Azadpur Mandi, Delhi',
    commodities: ['Vegetables'],
    outstandingBalance: 12700,
    toleranceLevel: 'MEDIUM',
    flexibility: 'MODERATE',
    lastSupplyDate: '2024-01-26',
    lastPaymentDate: '2024-01-23',
    daysSinceLastPayment: 5,
  },
  {
    id: 'v4',
    name: 'Patel Spices',
    contact: '+91 65432 10987',
    location: 'Khari Baoli, Delhi',
    commodities: ['Spices'],
    outstandingBalance: 1100,
    toleranceLevel: 'HIGH',
    flexibility: 'FLEXIBLE',
    lastSupplyDate: '2024-01-25',
    lastPaymentDate: '2024-01-27',
    daysSinceLastPayment: 1,
  },
  {
    id: 'v5',
    name: 'Gupta Oil Mills',
    contact: '+91 54321 09876',
    location: 'Industrial Area, Faridabad',
    commodities: ['Oil'],
    outstandingBalance: 5600,
    toleranceLevel: 'MEDIUM',
    flexibility: 'MODERATE',
    lastSupplyDate: '2024-01-24',
    lastPaymentDate: '2024-01-22',
    daysSinceLastPayment: 6,
  },
]

export const commodities: Commodity[] = [
  {
    id: 'c1',
    name: 'Milk',
    icon: '🥛',
    currentStock: 20,
    maxStock: 100,
    unit: 'liters',
    reorderThreshold: 25,
    linkedVendors: ['v1'],
  },
  {
    id: 'c2',
    name: 'Rice',
    icon: '🍚',
    currentStock: 65,
    maxStock: 100,
    unit: 'kg',
    reorderThreshold: 30,
    linkedVendors: ['v2'],
  },
  {
    id: 'c3',
    name: 'Vegetables',
    icon: '🥬',
    currentStock: 10,
    maxStock: 100,
    unit: 'kg',
    reorderThreshold: 20,
    linkedVendors: ['v3'],
  },
  {
    id: 'c4',
    name: 'Oil',
    icon: '🫒',
    currentStock: 45,
    maxStock: 100,
    unit: 'liters',
    reorderThreshold: 20,
    linkedVendors: ['v2', 'v5'],
  },
  {
    id: 'c5',
    name: 'Spices',
    icon: '🌶️',
    currentStock: 80,
    maxStock: 100,
    unit: 'kg',
    reorderThreshold: 15,
    linkedVendors: ['v4'],
  },
]

export const recentTransactions: Transaction[] = [
  {
    id: 't1',
    type: 'supply',
    vendorId: 'v1',
    vendorName: 'Ramesh Dairy',
    amount: 2400,
    date: '2024-01-28',
    commodity: 'Milk',
    quantity: 40,
    balanceAfter: 8400,
  },
  {
    id: 't2',
    type: 'payment',
    vendorId: 'v2',
    vendorName: 'Sharma Traders',
    amount: 1500,
    date: '2024-01-26',
    mode: 'UPI',
    balanceAfter: 3200,
  },
  {
    id: 't3',
    type: 'supply',
    vendorId: 'v3',
    vendorName: 'Fresh Farms',
    amount: 3200,
    date: '2024-01-26',
    commodity: 'Vegetables',
    quantity: 25,
    balanceAfter: 12700,
  },
  {
    id: 't4',
    type: 'payment',
    vendorId: 'v4',
    vendorName: 'Patel Spices',
    amount: 500,
    date: '2024-01-27',
    mode: 'Cash',
    balanceAfter: 1100,
  },
  {
    id: 't5',
    type: 'supply',
    vendorId: 'v2',
    vendorName: 'Sharma Traders',
    amount: 1800,
    date: '2024-01-27',
    commodity: 'Rice',
    quantity: 30,
    balanceAfter: 4700,
  },
  {
    id: 't6',
    type: 'payment',
    vendorId: 'v3',
    vendorName: 'Fresh Farms',
    amount: 2000,
    date: '2024-01-23',
    mode: 'Cash',
    balanceAfter: 9500,
  },
  {
    id: 't7',
    type: 'supply',
    vendorId: 'v5',
    vendorName: 'Gupta Oil Mills',
    amount: 2800,
    date: '2024-01-24',
    commodity: 'Oil',
    quantity: 20,
    balanceAfter: 5600,
  },
  {
    id: 't8',
    type: 'payment',
    vendorId: 'v5',
    vendorName: 'Gupta Oil Mills',
    amount: 1000,
    date: '2024-01-22',
    mode: 'UPI',
    balanceAfter: 2800,
  },
  {
    id: 't9',
    type: 'supply',
    vendorId: 'v4',
    vendorName: 'Patel Spices',
    amount: 800,
    date: '2024-01-25',
    commodity: 'Spices',
    quantity: 5,
    balanceAfter: 1600,
  },
  {
    id: 't10',
    type: 'payment',
    vendorId: 'v1',
    vendorName: 'Ramesh Dairy',
    amount: 3000,
    date: '2024-01-20',
    mode: 'Cash',
    balanceAfter: 6000,
  },
]

export const cashFlowData = [
  { date: 'Jan 1', inflow: 0, outflow: 2500 },
  { date: 'Jan 3', inflow: 3500, outflow: 0 },
  { date: 'Jan 5', inflow: 0, outflow: 4200 },
  { date: 'Jan 8', inflow: 2800, outflow: 0 },
  { date: 'Jan 10', inflow: 0, outflow: 1800 },
  { date: 'Jan 12', inflow: 4500, outflow: 0 },
  { date: 'Jan 15', inflow: 0, outflow: 3200 },
  { date: 'Jan 18', inflow: 2200, outflow: 0 },
  { date: 'Jan 20', inflow: 3000, outflow: 0 },
  { date: 'Jan 22', inflow: 0, outflow: 1000 },
  { date: 'Jan 24', inflow: 0, outflow: 2800 },
  { date: 'Jan 26', inflow: 1500, outflow: 3200 },
  { date: 'Jan 28', inflow: 0, outflow: 2400 },
]

export const vendorLedgers: Record<string, LedgerEntry[]> = {
  v1: [
    { id: 'l1', type: 'supply', date: '2024-01-28', amount: 2400, runningBalance: 8400, commodity: 'Milk', quantity: 40 },
    { id: 'l2', type: 'payment', date: '2024-01-20', amount: 3000, runningBalance: 6000, mode: 'Cash' },
    { id: 'l3', type: 'supply', date: '2024-01-15', amount: 2400, runningBalance: 9000, commodity: 'Milk', quantity: 40 },
    { id: 'l4', type: 'payment', date: '2024-01-10', amount: 2500, runningBalance: 6600, mode: 'UPI' },
    { id: 'l5', type: 'supply', date: '2024-01-05', amount: 2400, runningBalance: 9100, commodity: 'Milk', quantity: 40 },
  ],
  v2: [
    { id: 'l6', type: 'supply', date: '2024-01-27', amount: 1800, runningBalance: 4700, commodity: 'Rice', quantity: 30 },
    { id: 'l7', type: 'payment', date: '2024-01-26', amount: 1500, runningBalance: 3200, mode: 'UPI' },
    { id: 'l8', type: 'supply', date: '2024-01-20', amount: 2200, runningBalance: 4700, commodity: 'Oil', quantity: 15 },
    { id: 'l9', type: 'payment', date: '2024-01-15', amount: 2000, runningBalance: 2500, mode: 'Cash' },
  ],
  v3: [
    { id: 'l10', type: 'supply', date: '2024-01-26', amount: 3200, runningBalance: 12700, commodity: 'Vegetables', quantity: 25 },
    { id: 'l11', type: 'payment', date: '2024-01-23', amount: 2000, runningBalance: 9500, mode: 'Cash' },
    { id: 'l12', type: 'supply', date: '2024-01-18', amount: 2800, runningBalance: 11500, commodity: 'Vegetables', quantity: 22 },
    { id: 'l13', type: 'payment', date: '2024-01-12', amount: 3000, runningBalance: 8700, mode: 'UPI' },
  ],
  v4: [
    { id: 'l14', type: 'payment', date: '2024-01-27', amount: 500, runningBalance: 1100, mode: 'Cash' },
    { id: 'l15', type: 'supply', date: '2024-01-25', amount: 800, runningBalance: 1600, commodity: 'Spices', quantity: 5 },
    { id: 'l16', type: 'payment', date: '2024-01-20', amount: 600, runningBalance: 800, mode: 'Cash' },
    { id: 'l17', type: 'supply', date: '2024-01-15', amount: 700, runningBalance: 1400, commodity: 'Spices', quantity: 4 },
  ],
  v5: [
    { id: 'l18', type: 'supply', date: '2024-01-24', amount: 2800, runningBalance: 5600, commodity: 'Oil', quantity: 20 },
    { id: 'l19', type: 'payment', date: '2024-01-22', amount: 1000, runningBalance: 2800, mode: 'UPI' },
    { id: 'l20', type: 'supply', date: '2024-01-18', amount: 2200, runningBalance: 3800, commodity: 'Oil', quantity: 15 },
    { id: 'l21', type: 'payment', date: '2024-01-10', amount: 1500, runningBalance: 1600, mode: 'Cash' },
  ],
}

export const vendorBalanceHistory: Record<string, { date: string; balance: number }[]> = {
  v1: [
    { date: 'Jan 1', balance: 4500 },
    { date: 'Jan 5', balance: 6900 },
    { date: 'Jan 10', balance: 4400 },
    { date: 'Jan 15', balance: 6800 },
    { date: 'Jan 20', balance: 3800 },
    { date: 'Jan 28', balance: 8400 },
  ],
  v2: [
    { date: 'Jan 1', balance: 2000 },
    { date: 'Jan 10', balance: 3500 },
    { date: 'Jan 15', balance: 1500 },
    { date: 'Jan 20', balance: 3700 },
    { date: 'Jan 26', balance: 3200 },
  ],
  v3: [
    { date: 'Jan 1', balance: 8000 },
    { date: 'Jan 8', balance: 10500 },
    { date: 'Jan 12', balance: 7500 },
    { date: 'Jan 18', balance: 10300 },
    { date: 'Jan 23', balance: 8300 },
    { date: 'Jan 26', balance: 12700 },
  ],
  v4: [
    { date: 'Jan 1', balance: 500 },
    { date: 'Jan 10', balance: 900 },
    { date: 'Jan 15', balance: 1600 },
    { date: 'Jan 20', balance: 1000 },
    { date: 'Jan 25', balance: 1800 },
    { date: 'Jan 27', balance: 1100 },
  ],
  v5: [
    { date: 'Jan 1', balance: 1500 },
    { date: 'Jan 10', balance: 3000 },
    { date: 'Jan 18', balance: 5200 },
    { date: 'Jan 22', balance: 4200 },
    { date: 'Jan 24', balance: 5600 },
  ],
}

// Dashboard metrics
export const dashboardMetrics = {
  totalOutstandingDebt: vendors.reduce((sum, v) => sum + v.outstandingBalance, 0),
  cashInHand: 15000,
  activeVendors: vendors.length,
  lowStockAlerts: commodities.filter(c => c.currentStock <= c.reorderThreshold).length,
}

// Smart recommendations
export const smartBuyRecommendation = {
  commodity: 'Milk',
  vendor: vendors[0],
  reason: 'Lowest outstanding balance among milk suppliers',
  stockLevel: 20,
}

export const smartPayRecommendation = {
  vendor: vendors[0],
  reason: 'LOW tolerance, 8 days unpaid',
  toleranceLevel: 'LOW' as ToleranceLevel,
  daysSinceLastPayment: 8,
  outstandingAmount: 8400,
}

// Settings
export const restaurantSettings = {
  name: 'Tandoori Nights',
  ownerName: 'Rajesh Kumar',
  contact: '+91 99887 76655',
  cashInHand: 15000,
  notificationPreferences: {
    lowStockAlerts: true,
    overduePaymentAlerts: true,
  },
}
