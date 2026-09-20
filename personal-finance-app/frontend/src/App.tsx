import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import { useAuth } from './lib/auth';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import TransactionsPage from './pages/Transactions';
import AccountsPage from './pages/Accounts';
import { PortfolioPage, StocksPage, DividendsPage } from './pages/Investments';
import { BondsPage, CouponsPage } from './pages/Bonds';
import AssetsPage from './pages/Assets';
import LiabilitiesPage from './pages/Liabilities';
import BudgetPage from './pages/Budget';
import ReconciliationPage from './pages/Reconciliation';
import ReportsPage from './pages/Reports';
import SettingsPage from './pages/Settings';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen grid place-items-center text-slate-500">Memuat…</div>;
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage mode="login" />} />
        <Route path="/register" element={<LoginPage mode="register" />} />
        <Route path="/forgot-password" element={<LoginPage mode="forgot" />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/accounts/:id" element={<AccountsPage />} />
        <Route path="/investments/portfolio" element={<PortfolioPage />} />
        <Route path="/investments/stocks" element={<StocksPage />} />
        <Route path="/investments/bonds" element={<BondsPage />} />
        <Route path="/investments/dividends" element={<DividendsPage />} />
        <Route path="/investments/coupons" element={<CouponsPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/liabilities" element={<LiabilitiesPage />} />
        <Route path="/planning/budget" element={<BudgetPage />} />
        <Route path="/reconciliation" element={<ReconciliationPage />} />
        <Route path="/reports/:report" element={<ReportsPage />} />
        <Route path="/reports" element={<Navigate to="/reports/profit-loss" replace />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
