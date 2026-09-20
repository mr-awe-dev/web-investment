# Shared contracts

Enum dan bentuk DTO yang harus identik di frontend, backend, database dan laporan.
Sumber kebenaran: `backend/src/main/java/com/example/personalfinance/domain/**` dan `dto/response/**`;
cermin TypeScript: `frontend/src/types/domain.ts`; constraint SQL: `database/schema.sql`.

| Enum | Nilai |
|---|---|
| TransactionType | INCOME, EXPENSE, TRANSFER, BUY_INVESTMENT, SELL_INVESTMENT, DIVIDEND, COUPON, INTEREST, LOAN, DEBT_PAYMENT, ASSET_PURCHASE, ASSET_SALE, FEE, TAX, OPENING_BALANCE |
| CashFlowCategory | OPERATING, INVESTING, FINANCING, NONE |
| QuantityUnit | GRAM, LOT, UNIT, SHEET, SHARE, KG, LITER, METER, PIECE, OTHER |
| AccountCategory | BANK, RDN, CASH, EWALLET, DEPOSIT |
| AssetType | STOCK, BOND, MUTUAL_FUND, ETF, GOLD, DEPOSIT, PROPERTY, LAND, VEHICLE, OTHER |
| LiabilityType | LOAN, CREDIT_CARD, OTHER |
| CostBasisMethod | FIFO, AVERAGE, SPECIFIC |
| LedgerType | ASSET, LIABILITY, EQUITY, INCOME, EXPENSE |

Envelope API: `{ "success": boolean, "data": T | null, "message"?: string, "code"?: string, "timestamp": ISO-8601 }`.
Nilai uang selalu string desimal (mis. `"50150000.00"`) — frontend tidak pernah menghitung ulang total.
