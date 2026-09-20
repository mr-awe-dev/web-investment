# PRD — Personal Finance + Investment Accounting (monolith)

## Problem statement (original)
Build the web app from `Prompt-web-investment.md` (Java 21 + Spring Boot + PostgreSQL backend, Vite/React/TS frontend,
transaction-driven double-entry accounting, FIFO/Average/Specific lots, reports, 60/30/10 UI, no gradients) with best
practice, best performance, best in-code documentation and 100% unit-test coverage for the backend, without wasting tokens.

## User choices
- Generate Java/Spring Boot + SQL as files (environment cannot host Java/Postgres for the platform preview; a JDK 21 +
  Maven toolchain was installed under /root/tools to compile, test and smoke-run it).
- Scope: core (auth, CoA, accounts, all transaction types, accounting engine, lots, reports, dashboard, seed) +
  budget, bonds/coupon schedule, reconciliation, CSV export. Frontend as complete as possible. UI in Bahasa Indonesia.

## Architecture (implemented 2026-06)
`/app/personal-finance-app/` — backend (Spring Boot 3.3.5, Java 21, JPA, Security/JWT, Flyway V1–V5, JaCoCo gate
100% line + branch, 25 tests on H2), frontend (Vite 5, React 18, TS strict, Tailwind, Router, TanStack Query, RHF+Zod,
Recharts, Lucide; 14 routes), database (schema.sql, indexes.sql, seed.sql, migrations/, README), docker-compose,
.env.example, shared/README.md, root README.md.

Core flow: TransactionService → PortfolioService (lots) → AccountingService (journal, debit=credit) → LedgerService
(SUM per ledger account) → BalanceSheet/ProfitLoss/CashFlow/NetWorth/Portfolio/Report services. Per-user chart of
accounts with sub-accounts for money accounts/assets/liabilities. VOID instead of hard delete; PUT = revert + re-post.

## Personas
Individual investor in Indonesia tracking bank/RDN accounts, IDX stocks, bonds, gold, property, loans.

## Core requirements (static)
Double-entry invariants; single source of truth; BigDecimal money; DTO-only API; user isolation; pagination; indexes;
FIFO/Average/Specific; unrealized P/L never touches ledger; transfers never income/expense; debt payment splits principal
and interest; reports derived from ledger; 100% backend coverage.

## Implemented
- Auth (register/login/me/settings), CoA template + sub-accounts, accounts, assets (+price), liabilities.
- 15 transaction types incl. OPENING_BALANCE; multi-currency fields (original + rate + base); validation codes.
- Lots, lot consumptions, cost-basis engine; portfolio/positions/lots endpoints; stocks & dividends shortcuts.
- Reports: balance sheet, income-expense, cash flow, investment income, net-worth history/current, portfolio
  performance, dashboard (metrics, history, allocation, cash flow, upcoming coupons/debts, recent tx), CSV export.
- Bonds + derived coupon schedule, budgets vs actual, reconciliation.
- Demo seeder through the accounting engine; SQL seed with balanced journals; DB trigger enforcing balanced journals.
- Frontend pages: Login/Register/Forgot, Dashboard, Transactions (filters, pagination, dynamic form, detail drawer with
  journal/portfolio/cash-flow/P&L/lots, void/edit, CSV), Accounts (+detail), Portfolio, Stocks, Bonds, Dividends, Coupons,
  Assets, Liabilities, Budget, Reconciliation, Reports (P&L, cash flow, balance sheet, net worth, portfolio, debt), Settings.
- Verified: mvn test green (JaCoCo 100%/100%), tsc + vite build green, black-box smoke test 25/25 + UI pass.

## Backlog
P1: attachment upload (metadata table exists), audit log writes, Excel/PDF export, FX conversion for foreign-asset
market values, password reset.  P2: tax report, investment/debt goals, account balance history chart, calendar view
for dividends, dark theme.
