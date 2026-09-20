import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '../lib/api';
import type * as D from '../types/domain';

// Every screen reads through these hooks; the UI never computes financial totals itself.
export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: () => http.get<D.Dashboard>('/dashboard') });
export const useAccounts = () => useQuery({ queryKey: ['accounts'], queryFn: () => http.get<D.Account[]>('/accounts') });
export const useAccount = (id: number) => useQuery({ queryKey: ['accounts', id], queryFn: () => http.get<D.Account>(`/accounts/${id}`) });
export const useChartOfAccounts = () => useQuery({ queryKey: ['coa'], queryFn: () => http.get<D.ChartOfAccount[]>('/chart-of-accounts') });
export const useAssets = () => useQuery({ queryKey: ['assets'], queryFn: () => http.get<D.Asset[]>('/assets') });
export const useLiabilities = () => useQuery({ queryKey: ['liabilities'], queryFn: () => http.get<D.Liability[]>('/liabilities') });
export const usePortfolio = () => useQuery({ queryKey: ['portfolio'], queryFn: () => http.get<D.Portfolio>('/portfolio') });
export const useLots = (assetId?: number) => useQuery({ queryKey: ['lots', assetId], queryFn: () => http.get<D.StockLot[]>('/portfolio/lots', { assetId }) });
export const useBonds = () => useQuery({ queryKey: ['bonds'], queryFn: () => http.get<D.Bond[]>('/bonds') });
export const useCoupons = () => useQuery({ queryKey: ['coupons'], queryFn: () => http.get<D.Coupon[]>('/bonds/coupons') });
export const useCouponHistory = () => useQuery({ queryKey: ['coupon-history'], queryFn: () => http.get<D.Transaction[]>('/bonds/coupons/history') });
export const useDividends = () => useQuery({ queryKey: ['dividends'], queryFn: () => http.get<D.Transaction[]>('/dividends') });
export const useBudgets = (period: string) => useQuery({ queryKey: ['budgets', period], queryFn: () => http.get<D.Budget[]>('/budgets', { period }) });
export const useReconciliations = () => useQuery({ queryKey: ['reconciliations'], queryFn: () => http.get<D.Reconciliation[]>('/reconciliations') });

export interface TxFilter { from?: string; to?: string; type?: string; accountId?: number; assetId?: number; search?: string; page?: number; size?: number }
export const useTransactions = (f: TxFilter) => useQuery({ queryKey: ['transactions', f], queryFn: () => http.get<D.Page<D.Transaction>>('/transactions', { ...f }) });
export const useTransaction = (id?: number) => useQuery({ queryKey: ['transactions', 'detail', id], queryFn: () => http.get<D.TransactionDetail>(`/transactions/${id}`), enabled: !!id });

export const useBalanceSheet = (asOf?: string) => useQuery({ queryKey: ['bs', asOf], queryFn: () => http.get<D.BalanceSheet>('/reports/balance-sheet', { asOf }) });
export const useIncomeExpense = (from?: string, to?: string) => useQuery({ queryKey: ['pl', from, to], queryFn: () => http.get<D.IncomeExpense>('/reports/income-expense', { from, to }) });
export const useCashFlow = (from?: string, to?: string) => useQuery({ queryKey: ['cf', from, to], queryFn: () => http.get<D.CashFlow>('/reports/cash-flow', { from, to }) });
export const useNetWorthHistory = () => useQuery({ queryKey: ['nw'], queryFn: () => http.get<D.NetWorthPoint[]>('/reports/net-worth') });
export const useInvestmentIncome = (from?: string, to?: string) => useQuery({ queryKey: ['inv', from, to], queryFn: () => http.get<D.InvestmentIncome>('/reports/investment-income', { from, to }) });

/** Any write invalidates everything: every screen derives from the same ledger. */
function useInvalidatingMutation<TIn, TOut>(fn: (input: TIn) => Promise<TOut>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries() });
}
export const useCreateTransaction = () => useInvalidatingMutation((b: D.TransactionInput) => http.post<D.TransactionDetail>('/transactions', b));
export const useUpdateTransaction = () => useInvalidatingMutation(({ id, ...b }: D.TransactionInput & { id: number }) => http.put<D.TransactionDetail>(`/transactions/${id}`, b));
export const useDeleteTransaction = () => useInvalidatingMutation((id: number) => http.delete<void>(`/transactions/${id}`));
export const useCreateAccount = () => useInvalidatingMutation((b: Partial<D.Account>) => http.post<D.Account>('/accounts', b));
export const useCreateAsset = () => useInvalidatingMutation((b: Partial<D.Asset>) => http.post<D.Asset>('/assets', b));
export const useUpdatePrice = () => useInvalidatingMutation(({ id, ...b }: { id: number; currentPrice: number; valuationDate: string }) => http.put<D.Asset>(`/assets/${id}/price`, b));
export const useCreateLiability = () => useInvalidatingMutation((b: Partial<D.Liability>) => http.post<D.Liability>('/liabilities', b));
export const useCreateBond = () => useInvalidatingMutation((b: Record<string, unknown>) => http.post<D.Bond>('/bonds', b));
export const useUpsertBudget = () => useInvalidatingMutation((b: { categoryId: number; periodMonth: string; amount: number }) => http.post<D.Budget>('/budgets', b));
export const useDeleteBudget = () => useInvalidatingMutation((id: number) => http.delete<void>(`/budgets/${id}`));
export const useCreateReconciliation = () => useInvalidatingMutation((b: Record<string, unknown>) => http.post<D.Reconciliation>('/reconciliations', b));
export const useUpdateSettings = () => useInvalidatingMutation((b: { baseCurrency: string; costBasisMethod: D.CostBasisMethod; fullName: string }) => http.put<D.User>('/auth/settings', b));
export const exportTransactionsCsv = (f: TxFilter) => http.get<string>('/transactions/export', { ...f });
