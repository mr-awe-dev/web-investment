# Database

PostgreSQL 15+ schema for the Personal Finance + Investment Accounting system.

| File | Purpose |
|------|---------|
| `schema.sql` | Full schema (tables, constraints, balance trigger, cash-flow view) – concatenation of migrations 001–004 |
| `indexes.sql` | Performance indexes (identical to migration 005) |
| `seed.sql` | Demo user, chart of accounts, accounts, assets, liability and balanced sample journals |
| `migrations/` | Ordered migration files; the backend ships the same files as Flyway `V1..V5` |

```bash
createdb personal_finance
psql personal_finance -f schema.sql -f indexes.sql -f seed.sql
```

## Design

* **Single source of truth** – `transactions` → `journals` → `journal_entries`. Every balance (account, asset, liability,
  equity, income, expense) is `SUM(debit) - SUM(credit)` on `chart_of_accounts`. No stored totals.
* **Double entry enforced twice** – in the application (`Journal.validateBalanced`) and by the deferred constraint
  trigger `trg_journal_balanced` (`SUM(debit) = SUM(credit)` per journal at commit).
* **Per-user chart of accounts** – template accounts (`1000…5700`) plus one sub-account per money account, asset and
  liability (`1200.01`, `1400.02`, …) so balances need no extra tables.
* **Lots** – `stock_lots` (remaining quantity/cost) and `lot_consumptions` (which lot a sale consumed) make FIFO,
  average and specific identification auditable.
* **Money** – `NUMERIC(20,2)` for amounts, `NUMERIC(20,6)` for quantities / unit prices / FX rates. No floats.
* **Multi-currency** – transactions keep original amount, currency, `exchange_rate` and `base_amount`; journals are in
  the user's base currency.
* **Attachments** – metadata only (`storage_key`, `storage_path`); binaries live outside PostgreSQL.
* **Cash flow** – derived by `v_cash_flow`, never stored.
