-- Seed data: demo user (demo@finance.id / Demo1234!), chart of accounts, accounts, assets, liability
-- and a handful of transactions with their balanced double-entry journals.
-- The Spring Boot dev profile seeds a richer data set through the accounting engine (DemoDataSeeder);
-- this file lets you bootstrap a database without running the application.
BEGIN;

INSERT INTO users (id, email, password_hash, full_name, base_currency, cost_basis_method)
VALUES (1, 'demo@finance.id', '$2b$10$KwbMrFq5f1Cr7hq9OKshWO9vnYkSFXPyY.Dq3Vnul4DLhgtvve0aK', 'Demo Investor', 'IDR', 'FIFO');

INSERT INTO chart_of_accounts (id, user_id, code, name, type, parent_code, cash, system) VALUES
 (1,1,'1000','Aset','ASSET',NULL,FALSE,TRUE),(2,1,'1100','Kas','ASSET','1000',TRUE,TRUE),(3,1,'1200','Bank','ASSET','1000',TRUE,TRUE),
 (4,1,'1300','RDN','ASSET','1000',TRUE,TRUE),(5,1,'1400','Saham','ASSET','1000',FALSE,TRUE),(6,1,'1500','Obligasi','ASSET','1000',FALSE,TRUE),
 (7,1,'1600','Deposito','ASSET','1000',TRUE,TRUE),(8,1,'1700','Properti','ASSET','1000',FALSE,TRUE),(9,1,'1800','Aset Lainnya','ASSET','1000',FALSE,TRUE),
 (10,1,'2000','Liabilitas','LIABILITY',NULL,FALSE,TRUE),(11,1,'2100','Pinjaman','LIABILITY','2000',FALSE,TRUE),(12,1,'2200','Kartu Kredit','LIABILITY','2000',FALSE,TRUE),
 (13,1,'2300','Utang Lainnya','LIABILITY','2000',FALSE,TRUE),(14,1,'3000','Ekuitas','EQUITY',NULL,FALSE,TRUE),(15,1,'3100','Modal Pemilik','EQUITY','3000',FALSE,TRUE),
 (16,1,'3200','Laba Ditahan','EQUITY','3000',FALSE,TRUE),(17,1,'4000','Pendapatan','INCOME',NULL,FALSE,TRUE),(18,1,'4100','Gaji','INCOME','4000',FALSE,TRUE),
 (19,1,'4200','Pendapatan Dividen','INCOME','4000',FALSE,TRUE),(20,1,'4300','Pendapatan Kupon','INCOME','4000',FALSE,TRUE),(21,1,'4400','Pendapatan Bunga','INCOME','4000',FALSE,TRUE),
 (22,1,'4500','Laba Realisasi','INCOME','4000',FALSE,TRUE),(23,1,'4600','Pendapatan Lainnya','INCOME','4000',FALSE,TRUE),(24,1,'5000','Beban','EXPENSE',NULL,FALSE,TRUE),
 (25,1,'5100','Makanan','EXPENSE','5000',FALSE,TRUE),(26,1,'5200','Perumahan','EXPENSE','5000',FALSE,TRUE),(27,1,'5300','Beban Bunga','EXPENSE','5000',FALSE,TRUE),
 (28,1,'5400','Biaya Investasi','EXPENSE','5000',FALSE,TRUE),(29,1,'5500','Pajak','EXPENSE','5000',FALSE,TRUE),(30,1,'5600','Transportasi','EXPENSE','5000',FALSE,TRUE),
 (31,1,'5700','Beban Lainnya','EXPENSE','5000',FALSE,TRUE),
 -- sub-ledgers owned by money accounts / assets / liabilities
 (32,1,'1200.01','BCA Tahapan','ASSET','1200',TRUE,FALSE),(33,1,'1300.01','RDN Sekuritas A','ASSET','1300',TRUE,FALSE),
 (34,1,'1400.01','Bank Central Asia','ASSET','1400',FALSE,FALSE),(35,1,'2100.01','KPR Rumah','LIABILITY','2100',FALSE,FALSE);

INSERT INTO accounts (id, user_id, name, category, currency, institution, ledger_account_id) VALUES
 (1,1,'BCA Tahapan','BANK','IDR','BCA',32),(2,1,'RDN Sekuritas A','RDN','IDR','Stockbit Sekuritas',33);

INSERT INTO assets (id, user_id, code, name, asset_type, currency, quantity_unit, sector, current_price, ledger_account_id) VALUES
 (1,1,'BBCA','Bank Central Asia','STOCK','IDR','SHARE','Keuangan',10250,34);

INSERT INTO liabilities (id, user_id, name, creditor, liability_type, currency, interest_rate, tenor_months, installment, due_date, ledger_account_id) VALUES
 (1,1,'KPR Rumah','Bank BTN','LOAN','IDR',8.5,180,5500000,CURRENT_DATE + 12,35);

-- 1. Opening balance BCA 85.000.000  (Dr Bank / Cr Modal Pemilik)
INSERT INTO transactions (id,user_id,transaction_date,transaction_type,account_id,gross_amount,net_amount,currency,base_currency,base_amount,description)
VALUES (1,1,'2026-01-01','OPENING_BALANCE',1,85000000,85000000,'IDR','IDR',85000000,'Saldo awal BCA');
INSERT INTO journals (id,transaction_id,journal_date,description) VALUES (1,1,'2026-01-01','Saldo awal BCA');
INSERT INTO journal_entries (journal_id,ledger_account_id,debit,credit) VALUES (1,32,85000000,0),(1,15,0,85000000);

-- 2. Transfer BCA -> RDN 30.000.000 (net worth unchanged)
INSERT INTO transactions (id,user_id,transaction_date,transaction_type,account_id,destination_account_id,gross_amount,net_amount,currency,base_currency,base_amount,description)
VALUES (2,1,'2026-01-05','TRANSFER',1,2,30000000,30000000,'IDR','IDR',30000000,'Top up RDN');
INSERT INTO journals (id,transaction_id,journal_date,description) VALUES (2,2,'2026-01-05','Top up RDN');
INSERT INTO journal_entries (journal_id,ledger_account_id,debit,credit) VALUES (2,33,30000000,0),(2,32,0,30000000);

-- 3. Buy BBCA 2.000 x 9.800 + broker fee 29.400 => cost 19.629.400 (Dr Saham BBCA / Cr RDN)
INSERT INTO transactions (id,user_id,transaction_date,transaction_type,account_id,asset_id,quantity,quantity_unit,unit_price,gross_amount,broker_fee,net_amount,currency,base_currency,base_amount,description)
VALUES (3,1,'2026-01-06','BUY_INVESTMENT',2,1,2000,'SHARE',9800,19600000,29400,19629400,'IDR','IDR',19629400,'Beli BBCA');
INSERT INTO journals (id,transaction_id,journal_date,description) VALUES (3,3,'2026-01-06','Beli BBCA');
INSERT INTO journal_entries (journal_id,ledger_account_id,debit,credit) VALUES (3,34,19629400,0),(3,33,0,19629400);
INSERT INTO stock_lots (id,user_id,asset_id,transaction_id,purchase_date,quantity,remaining_quantity,total_cost,remaining_cost,status)
VALUES (1,1,1,3,'2026-01-06',2000,2000,19629400,19629400,'OPEN');

-- 4. Salary 25.000.000, tax 1.250.000 (Dr Bank 23.750.000, Dr Pajak 1.250.000 / Cr Gaji 25.000.000)
INSERT INTO transactions (id,user_id,transaction_date,transaction_type,account_id,category_id,gross_amount,tax,net_amount,currency,base_currency,base_amount,description)
VALUES (4,1,'2026-01-25','INCOME',1,18,25000000,1250000,23750000,'IDR','IDR',23750000,'Gaji Januari');
INSERT INTO journals (id,transaction_id,journal_date,description) VALUES (4,4,'2026-01-25','Gaji Januari');
INSERT INTO journal_entries (journal_id,ledger_account_id,debit,credit) VALUES (4,32,23750000,0),(4,29,1250000,0),(4,18,0,25000000);

-- 5. Loan received 450.000.000 (Dr Bank / Cr KPR)
INSERT INTO transactions (id,user_id,transaction_date,transaction_type,account_id,liability_id,gross_amount,net_amount,currency,base_currency,base_amount,description)
VALUES (5,1,'2026-02-01','LOAN',1,1,450000000,450000000,'IDR','IDR',450000000,'Pencairan KPR');
INSERT INTO journals (id,transaction_id,journal_date,description) VALUES (5,5,'2026-02-01','Pencairan KPR');
INSERT INTO journal_entries (journal_id,ledger_account_id,debit,credit) VALUES (5,32,450000000,0),(5,35,0,450000000);

-- 6. Debt payment: principal 2.400.000 + interest 3.100.000 (Dr KPR, Dr Beban Bunga / Cr Bank 5.500.000)
INSERT INTO transactions (id,user_id,transaction_date,transaction_type,account_id,liability_id,gross_amount,interest_amount,net_amount,currency,base_currency,base_amount,description)
VALUES (6,1,'2026-02-15','DEBT_PAYMENT',1,1,2400000,3100000,5500000,'IDR','IDR',5500000,'Cicilan KPR');
INSERT INTO journals (id,transaction_id,journal_date,description) VALUES (6,6,'2026-02-15','Cicilan KPR');
INSERT INTO journal_entries (journal_id,ledger_account_id,debit,credit) VALUES (6,35,2400000,0),(6,27,3100000,0),(6,32,0,5500000);

-- 7. Dividend BBCA 2.000 x 135 = 270.000, tax 27.000 (Dr RDN 243.000, Dr Pajak 27.000 / Cr Dividen 270.000)
INSERT INTO transactions (id,user_id,transaction_date,transaction_type,account_id,asset_id,quantity,quantity_unit,unit_price,gross_amount,tax,net_amount,currency,base_currency,base_amount,description)
VALUES (7,1,'2026-03-04','DIVIDEND',2,1,2000,'SHARE',135,270000,27000,243000,'IDR','IDR',243000,'Dividen BBCA');
INSERT INTO journals (id,transaction_id,journal_date,description) VALUES (7,7,'2026-03-04','Dividen BBCA');
INSERT INTO journal_entries (journal_id,ledger_account_id,debit,credit) VALUES (7,33,243000,0),(7,29,27000,0),(7,19,0,270000);

-- 8. Food expense 3.200.000 (Dr Makanan / Cr Bank)
INSERT INTO transactions (id,user_id,transaction_date,transaction_type,account_id,category_id,gross_amount,net_amount,currency,base_currency,base_amount,description)
VALUES (8,1,'2026-03-10','EXPENSE',1,25,3200000,3200000,'IDR','IDR',3200000,'Belanja bulanan');
INSERT INTO journals (id,transaction_id,journal_date,description) VALUES (8,8,'2026-03-10','Belanja bulanan');
INSERT INTO journal_entries (journal_id,ledger_account_id,debit,credit) VALUES (8,25,3200000,0),(8,32,0,3200000);

INSERT INTO budgets (user_id, category_id, period_month, amount) VALUES (1,25,TO_CHAR(CURRENT_DATE,'YYYY-MM'),3500000),(1,26,TO_CHAR(CURRENT_DATE,'YYYY-MM'),2000000);

-- keep sequences ahead of explicit ids
SELECT setval('users_id_seq', 10); SELECT setval('chart_of_accounts_id_seq', 100); SELECT setval('accounts_id_seq', 10);
SELECT setval('assets_id_seq', 10); SELECT setval('liabilities_id_seq', 10); SELECT setval('transactions_id_seq', 100);
SELECT setval('journals_id_seq', 100); SELECT setval('stock_lots_id_seq', 10);
COMMIT;
