// Domain models mirrored from backend DTOs. All money values arrive as decimal strings and are never recomputed here.
export type Money = string;

export type LedgerType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
export type TransactionType =
  | 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'BUY_INVESTMENT' | 'SELL_INVESTMENT' | 'DIVIDEND' | 'COUPON' | 'INTEREST'
  | 'LOAN' | 'DEBT_PAYMENT' | 'ASSET_PURCHASE' | 'ASSET_SALE' | 'FEE' | 'TAX' | 'OPENING_BALANCE';
export type CashFlowCategory = 'OPERATING' | 'INVESTING' | 'FINANCING' | 'NONE';
export type QuantityUnit = 'GRAM' | 'LOT' | 'UNIT' | 'SHEET' | 'SHARE' | 'KG' | 'LITER' | 'METER' | 'PIECE' | 'OTHER';
export type AccountCategory = 'BANK' | 'RDN' | 'CASH' | 'EWALLET' | 'DEPOSIT';
export type AssetType = 'STOCK' | 'BOND' | 'MUTUAL_FUND' | 'ETF' | 'GOLD' | 'DEPOSIT' | 'PROPERTY' | 'LAND' | 'VEHICLE' | 'OTHER';
export type LiabilityType = 'LOAN' | 'CREDIT_CARD' | 'OTHER';
export type CostBasisMethod = 'FIFO' | 'AVERAGE' | 'SPECIFIC';

export interface ApiEnvelope<T> { success: boolean; data: T; message?: string; code?: string; timestamp: string }
export interface Page<T> { content: T[]; page: number; size: number; totalElements: number; totalPages: number }

export interface User { id: number; email: string; fullName: string; baseCurrency: string; costBasisMethod: CostBasisMethod }
export interface AuthResponse { token: string; user: User }

export interface Account { id: number; name: string; category: AccountCategory; currency: string; institution?: string; ledgerCode: string; balance: Money; active: boolean }
export interface ChartOfAccount { id: number; code: string; name: string; type: LedgerType; parentCode?: string; cash: boolean; system: boolean; balance: Money }

export interface Asset {
  id: number; code: string; name: string; assetType: AssetType; currency: string; quantityUnit: QuantityUnit; sector?: string;
  currentPrice: Money; valuationDate?: string; ledgerCode: string; quantity: Money; averageCost: Money; totalCost: Money;
  marketValue: Money; unrealizedPl: Money; unrealizedPlPercent: Money; realizedPl: Money; allocationPercent: Money;
}
export interface Liability {
  id: number; name: string; creditor?: string; liabilityType: LiabilityType; currency: string; interestRate: Money; tenorMonths?: number;
  installment?: Money; dueDate?: string; ledgerCode: string; outstanding: Money; status: 'ACTIVE' | 'PAID_OFF';
}

export interface Transaction {
  id: number; transactionDate: string; type: TransactionType; cashFlowCategory: CashFlowCategory;
  accountId: number; accountName: string; destinationAccountId?: number; destinationAccountName?: string;
  categoryId?: number; categoryName?: string; assetId?: number; assetCode?: string; liabilityId?: number; liabilityName?: string;
  quantity?: Money; quantityUnit?: QuantityUnit; unitPrice?: Money; grossAmount: Money; adminFee: Money; brokerFee: Money; levy: Money;
  tax: Money; interestAmount: Money; netAmount: Money; costBasis?: Money; realizedPl?: Money; currency: string; exchangeRate: Money;
  baseCurrency: string; baseAmount: Money; reference?: string; description?: string; status: 'POSTED' | 'VOID';
}
export interface JournalEntry { ledgerCode: string; ledgerName: string; debit: Money; credit: Money; memo?: string }
export interface LotConsumption { lotId: number; lotPurchaseDate: string; quantity: Money; costBasis: Money }
export interface TransactionDetail {
  transaction: Transaction; journalEntries: JournalEntry[]; portfolioQuantityImpact?: Money; cashFlowCategory: CashFlowCategory;
  cashFlowImpact: Money; realizedPl?: Money; lotConsumptions: LotConsumption[];
}
export interface TransactionInput {
  transactionDate: string; type: TransactionType; accountId: number; destinationAccountId?: number; categoryId?: number; assetId?: number;
  liabilityId?: number; quantity?: number; quantityUnit?: QuantityUnit; unitPrice?: number; grossAmount?: number; adminFee?: number;
  brokerFee?: number; levy?: number; tax?: number; interestAmount?: number; currency?: string; exchangeRate?: number; reference?: string;
  description?: string; lotIds?: number[];
}

export interface StockLot {
  id: number; assetId: number; assetCode: string; transactionId: number; purchaseDate: string; quantity: Money; remainingQuantity: Money;
  unitCost: Money; totalCost: Money; remainingCost: Money; status: 'OPEN' | 'PARTIAL' | 'CLOSED';
}
export interface Portfolio { totalCost: Money; marketValue: Money; unrealizedPl: Money; unrealizedPlPercent: Money; realizedPl: Money; positions: Asset[] }

export interface LineItem { code: string; label: string; amount: Money }
export interface BalanceSheet { asOf: string; totalAssets: Money; totalLiabilities: Money; equity: Money; assets: LineItem[]; liabilities: LineItem[]; equityItems: LineItem[]; balanced: boolean }
export interface IncomeExpense { from: string; to: string; totalIncome: Money; totalExpense: Money; netResult: Money; income: LineItem[]; expenses: LineItem[] }
export interface CashFlowLine { category: CashFlowCategory; type: TransactionType; amount: Money }
export interface CashFlow { from: string; to: string; operating: Money; investing: Money; financing: Money; netCashFlow: Money; lines: CashFlowLine[] }
export interface NetWorthPoint { date: string; totalAssets: Money; totalLiabilities: Money; netWorth: Money }
export interface InvestmentIncome { dividendIncome: Money; couponIncome: Money; interestIncome: Money; realizedPl: Money; unrealizedPl: Money; fees: Money; taxes: Money; totalReturn: Money }
export interface UpcomingItem { kind: 'COUPON' | 'DEBT_PAYMENT'; label: string; date: string; amount: Money }
export interface Dashboard {
  totalAssets: Money; totalInvestments: Money; cashAndBank: Money; totalLiabilities: Money; netWorth: Money; investment: InvestmentIncome;
  netWorthHistory: NetWorthPoint[]; allocation: LineItem[]; cashFlow: CashFlow; upcoming: UpcomingItem[]; recentTransactions: Transaction[];
}

export interface CouponItem { paymentDate: string; gross: Money; tax: Money; net: Money; status: 'UPCOMING' | 'PAID' }
export interface Bond {
  id: number; assetId: number; assetCode: string; assetName: string; issuer?: string; bondType?: string; nominalValue: Money; couponRate: Money;
  taxRate: Money; frequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL'; settlementDate: string; maturityDate: string; schedule: CouponItem[];
}
export interface Coupon extends CouponItem { bondId: number; assetCode: string; assetName: string }
export interface Budget { id: number; categoryId: number; categoryCode: string; categoryName: string; periodMonth: string; amount: Money; actual: Money; remaining: Money; status: 'HEALTHY' | 'NEAR_LIMIT' | 'OVER_BUDGET' }
export interface Reconciliation { id: number; accountId: number; accountName: string; reconciliationDate: string; systemBalance: Money; actualBalance: Money; difference: Money; status: 'RECONCILED' | 'DIFFERENCE_FOUND' | 'PENDING_REVIEW'; notes?: string }
