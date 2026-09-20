# Personal Finance + Investment Accounting

Aplikasi akuntansi keuangan pribadi & investasi **monolitik** — satu repositori, satu backend Spring Boot, satu database PostgreSQL, satu frontend React.

```
personal-finance-app/
├── backend/     Java 21 · Spring Boot 3.3 · Spring Data JPA · Spring Security (JWT) · Flyway · JUnit 5 + Mockito · JaCoCo 100%
├── frontend/    Vite · React 18 · TypeScript (strict) · Tailwind · React Router · TanStack Query · React Hook Form + Zod · Recharts · Lucide
├── database/    schema.sql · indexes.sql · seed.sql · migrations/ · README.md
├── shared/      Kontrak API & enum yang dipakai bersama (dokumentasi)
├── docker-compose.yml · .env.example · package.json
```

## Prinsip arsitektur

**Transaksi adalah satu-satunya sumber perubahan finansial.**

```
TransactionController → TransactionService → PortfolioService (lot) → AccountingService (jurnal double-entry)
                                                                  ↓
                     LedgerService (SUM debit/kredit per akun buku besar)
                                                                  ↓
     BalanceSheetService · ProfitLossService · CashFlowService · NetWorthService · PortfolioService · ReportService
```

* Setiap transaksi (15 tipe: income, expense, transfer, buy/sell investasi, dividen, kupon, bunga, pinjaman, bayar utang,
  beli/jual aset, fee, pajak, saldo awal) menghasilkan jurnal berimbang: **Total Debit = Total Kredit** (divalidasi di
  Java *dan* oleh constraint trigger PostgreSQL).
* Saldo akun, aset, liabilitas, ekuitas, pendapatan dan beban **tidak disimpan** — semuanya `SUM(debit) − SUM(credit)`
  dari `journal_entries`. Neraca selalu memenuhi **Aset − Liabilitas = Ekuitas**.
* Pembelian membuat **lot**; penjualan mengonsumsi lot dengan **FIFO / Average / Specific Identification**
  (`CostBasisEngine`) dan mencatat *lot consumption* untuk audit. Realized P/L masuk ke akun 4500; unrealized P/L hanya
  dihitung dari harga pasar dan **tidak** menyentuh jurnal, kas, maupun arus kas.
* Transfer antar akun sendiri tidak menyentuh pendapatan/beban (kekayaan bersih tetap). Dividen/kupon adalah
  *pendapatan investasi* (4200/4300), terpisah dari laba realisasi. Pembayaran utang memisahkan pokok (Dr liabilitas)
  dan bunga (Dr beban bunga).
* Semua operasi finansial `@Transactional`: jika langkah apa pun gagal, transaksi, lot dan jurnal di-*rollback* bersama
  (dibuktikan oleh `AtomicityTest`).
* Uang memakai `BigDecimal` / `NUMERIC(20,2)`; kuantitas & harga satuan `NUMERIC(20,6)`. Multi-mata uang: jumlah asli,
  kurs, dan jumlah dalam mata uang dasar disimpan bersama; jurnal selalu dalam mata uang dasar pengguna.
* API hanya mengekspos DTO (record), tidak pernah entity JPA. Error selalu `{success:false, message, code, timestamp}`.
* Pengguna terisolasi: setiap query di-scope oleh `user_id`; data pengguna lain menghasilkan 404.

## Menjalankan

```bash
cp .env.example .env
docker compose up --build            # db :5432 · backend :8080 · frontend :5173
# atau lokal
docker compose up -d db
cd backend && mvn spring-boot:run     # profil dev: Flyway migrasi + seed data demo via accounting engine
cd frontend && yarn && yarn dev
```

Akun demo: **demo@finance.id / Demo1234!** (dibuat oleh `DemoDataSeeder`, atau `database/seed.sql`).

## Pengujian & cakupan

```bash
cd backend && mvn test               # 24 tes; JaCoCo memaksa 100% line + 100% branch (build gagal jika kurang)
open target/site/jacoco/index.html
```

Tes menggunakan H2 (mode PostgreSQL) agar dapat berjalan tanpa Docker dan mencakup: debit = kredit, buy/sell, FIFO,
average, specific identification, realized & unrealized P/L, transfer Bank → RDN tanpa mengubah kekayaan bersih,
dividen → pendapatan investasi + kas, pinjaman, pembayaran pokok + bunga, saldo utang, neraca Aset − Liabilitas = Ekuitas,
atomicity (rollback), validasi per tipe transaksi, isolasi antar pengguna, laporan, anggaran, rekonsiliasi, obligasi/kupon,
ekspor CSV, dan autentikasi JWT.

## Endpoint utama

| Method | Path | Keterangan |
|---|---|---|
| POST | `/api/auth/register` · `/login` · GET `/me` · PUT `/settings` | JWT, mata uang dasar, metode cost basis |
| GET/POST | `/api/accounts`, `/api/accounts/{id}` (PUT) | Akun uang; saldo dari buku besar |
| GET | `/api/chart-of-accounts` | Bagan akun + saldo |
| GET/POST/PUT/DELETE | `/api/transactions`, `/api/transactions/{id}`, GET `/export` | CRUD (DELETE = void), filter, paginasi, CSV |
| GET/POST | `/api/assets`, PUT `/api/assets/{id}/price` | Aset + posisi; update harga pasar |
| GET | `/api/portfolio`, `/positions`, `/lots?assetId=` | Portofolio, posisi, lot |
| GET/POST | `/api/stocks`, `/stocks/buy`, `/stocks/sell`, `/api/dividends` | Shortcut bertipe |
| GET/POST | `/api/bonds`, GET `/bonds/coupons`, `/bonds/coupons/history` | Obligasi & jadwal kupon |
| GET/POST | `/api/liabilities` | Utang; sisa pokok dari buku besar |
| GET/POST/DELETE | `/api/budgets?period=YYYY-MM` | Anggaran vs realisasi |
| GET/POST | `/api/reconciliations` | Rekonsiliasi saldo |
| GET | `/api/dashboard`, `/api/reports/balance-sheet`, `/income-expense`, `/cash-flow`, `/investment-income`, `/net-worth`, `/net-worth/current`, `/portfolio-performance` | Laporan |

## Belum termasuk (backlog)

Unggah lampiran (tabel `attachments` sudah ada), audit log otomatis, ekspor Excel/PDF (CSV & cetak tersedia),
konversi kurs untuk konsolidasi nilai pasar aset asing, laporan pajak, target investasi/utang, reset kata sandi.
