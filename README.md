# Personal Finance Application

## Business Overview

This application helps individuals and families manage their complete financial picture—from daily expenses and budgeting to investment tracking and net worth monitoring. It uses **double-entry accounting** to ensure every transaction is balanced, providing accurate financial statements and reports.

## Core Business Processes

### 1. User & Onboarding
- Users register with email and password
- Each user has a preferred cost basis method for investments: FIFO (First-In-First-Out), AVERAGE, or SPECIFIC
- Personal currency preference (default: IDR)

### 2. Chart of Accounts (Ledger)
- Users define their financial categories (accounts)
- **Asset accounts**: Cash, bank deposits, stocks, bonds, property, vehicles
- **Liability accounts**: Loans, credit cards, other debts
- **Equity accounts**: Owner capital, retained earnings
- **Income accounts**: Salary, dividends, interest, other income
- **Expense accounts**: Food, housing, transportation, taxes, investment fees
- Accounts can have a hierarchical structure (parent/child codes)

### 3. Transaction Recording (Double-Entry Bookkeeping)
- Every financial event is recorded as a **transaction**
- Each transaction creates **balanced journal entries** (total debits = total credits)
- Transaction types include:
  - **Income**: Salary, dividends, coupons, interest received
  - **Expense**: Food, housing, transportation, taxes, fees
  - **Transfer**: Moving money between accounts (no net worth change)
  - **Investment**: Buying or selling stocks, bonds, mutual funds
  - **Loan**: Receiving or repaying loans
  - **Opening balance**: Initial account balances

### 4. Investment Tracking
- Track stock/ETF lots with purchase date, quantity, and cost
- **Cost basis methods**: FIFO, AVERAGE, or SPECIFIC when selling
- Corporate actions: dividends, coupons, interest payments
- Automatic lot consumption tracking when selling investments

### 5. Loan Management
- Track loans with creditor, interest rate, tenor, and installments
- Record debt payments (principal + interest)
- Monitor outstanding balances and due dates

### 6. Budgeting
- Set monthly budgets per expense category
- Track actual spending vs. budget
- Status indicators: HEALTHY, NEAR_LIMIT, OVER_BUDGET

### 7. Bank Reconciliation
- Compare system balance vs. actual bank statement balance
- Identify and note discrepancies
- Mark as reconciled when balances match

### 8. Financial Reporting
- **Balance Sheet**: Assets, liabilities, equity at a point in time
- **Income & Expense**: Revenue and cost breakdown over periods
- **Cash Flow**: Operating, investing, and financing cash movements
- **Net Worth**: Total assets minus total liabilities over time
- **Portfolio Performance**: Market value, unrealized gains, dividends, fees, taxes

### 9. Attachments & Audit
- attach receipts, statements, or documents to transactions
- Full audit log of all CREATE, UPDATE, DELETE, and VOID actions

## Key Business Rules

- **Money is never floating point**: All amounts use `BigDecimal` (Java) / decimal strings (TypeScript) to avoid rounding errors
- **Per-user data isolation**: Every query scopes by `user_id`—users can only see their own data
- **Journal balancing**: The database enforces `SUM(debit) = SUM(credit)` per journal at the SQL level
- **Cash flow is derived**: Calculated from journal lines on cash accounts, never stored directly
- **Exchange rates**: All transactions have original currency + exchange rate + base currency (IDR) for auditing

## Technology Stack

- **Backend**: Spring Boot 3.3.5, Java 21, PostgreSQL, Flyway migrations, JWT authentication
- **Frontend**: React 18.3.1, TypeScript (strict), Vite, TailwindCSS, TanStack Query, React Router
- **Double-entry engine**: Fully implemented with database-level triggers for journal balance validation

## Getting Started (Business Users)

The application is ready to use after setup. Key steps:

1. **Database**: PostgreSQL with the provided schema migrations
2. **Initial data**: A demo user is available (`demo@finance.id`) with a full chart of accounts and sample transactions
3. **Start the app**: Use Docker Compose or run backend/frontend manually
4. **Login**: Access the frontend at `http://localhost:5173`, backend API at `http://localhost:8080`

## API Envelope

All API responses follow a standard format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "code": "Optional error code",
  "timestamp": "ISO-8601 datetime"
}
```

Money values are always transmitted as **decimal strings** (e.g., `"50150000.00"`). The frontend never recomputes totals—it trusts the values as provided.