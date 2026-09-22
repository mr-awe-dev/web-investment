Tentu. Karena fokus Anda adalah **investasi saham \+ investasi obligasi**, saya sarankan sistemnya dibuat sebagai **Personal Finance \+ Investment Accounting System**. Fokus utamanya bukan hanya mencatat uang masuk/keluar, tetapi mampu menjawab:

> **“Berapa kekayaan saya sekarang, dari mana keuntungan saya berasal, aset mana yang menghasilkan, berapa hutang saya, dan bagaimana arus kas saya?”**

# **1\. Dashboard Utama**

Dashboard sebaiknya langsung menampilkan kondisi keuangan terkini.

* Total aset  
* Total investasi  
* Total saham  
* Total obligasi  
* Kas & rekening bank  
* Total hutang  
* **Total ekuitas / net worth**  
* Unrealized gain/loss  
* Realized gain/loss  
* Pendapatan bulan berjalan  
* Pengeluaran bulan berjalan  
* Net cash flow  
* Dividen yang akan diterima  
* Kupon obligasi yang akan diterima  
* Hutang yang segera jatuh tempo  
* Grafik perkembangan net worth  
* Grafik portfolio

Contoh:

| Indikator | Nilai |
| :---- | :---- |
| Total Aset | Rp3,00 M |
| Saham | Rp1,20 M |
| Obligasi | Rp900 jt |
| Kas & Bank | Rp300 jt |
| Aset lainnya | Rp600 jt |
| Total Hutang | Rp500 jt |
| **Ekuitas** | **Rp2,50 M** |

---

# **2\. Manajemen Rekening**

Semua sumber dana harus mempunyai rekening sendiri.

Contohnya:

* BCA  
* Mandiri  
* BNI  
* RDN Sekuritas A  
* RDN Sekuritas B  
* Rekening deposito  
* Kas  
* E-wallet

Fitur:

* Saldo awal  
* Saldo berjalan  
* Mutasi  
* Transfer antar rekening  
* Rekonsiliasi  
* Import CSV/Excel  
* Riwayat transaksi  
* Filter berdasarkan rekening

**Penting:** transfer dari bank ke RDN bukan expense. Itu hanya perpindahan aset.

---

# **3\. Transaksi Harian**

Ini sebaiknya menjadi pusat sistem.

Setiap transaksi mempunyai:

* Tanggal  
* Jenis transaksi  
* Akun/rekening  
* Kategori  
* Nominal  
* Debit/kredit  
* Aset terkait  
* Keterangan  
* Referensi transaksi  
* Lampiran bukti transaksi

Jenis transaksi:

* Income  
* Expense  
* Transfer  
* Buy investment  
* Sell investment  
* Dividend  
* Coupon  
* Interest  
* Loan  
* Debt payment  
* Asset purchase  
* Asset sale  
* Fee  
* Tax

Sediakan filter:

> Hari ini / minggu ini / bulan ini / custom date

---

# **4\. Manajemen Saham**

Untuk saham, saya sarankan jangan hanya menyimpan "jumlah saham".

Data transaksi:

* Kode saham  
* Nama saham  
* Tanggal beli  
* Jumlah lot  
* Jumlah saham  
* Harga beli  
* Gross value  
* Fee broker  
* Levy  
* Pajak  
* Total cost  
* Broker  
* Rekening sumber

Untuk penjualan:

* Tanggal jual  
* Jumlah  
* Harga jual  
* Gross proceeds  
* Fee  
* Pajak  
* Net proceeds  
* Cost basis  
* Realized P/L

---

# **5\. Portfolio Saham**

Sistem kemudian menghasilkan posisi saham secara otomatis.

| Saham | Qty | Avg Cost | Harga | Market Value | Unrealized P/L |
| :---- | ----- | ----- | ----- | ----- | ----- |
| Saham A | 10.000 | Rp5.000 | Rp5.500 | Rp55 jt | \+Rp5 jt |
| Saham B | 20.000 | Rp3.000 | Rp2.800 | Rp56 jt | \-Rp4 jt |

Tambahkan:

* Average cost  
* Total cost  
* Current price  
* Market value  
* Unrealized P/L  
* Realized P/L  
* P/L %  
* Holding period  
* Dividen  
* Portfolio allocation  
* Sector allocation

---

# **6\. Lot Tracking**

Kalau Anda membeli saham beberapa kali, sistem harus bisa mengetahui cost basis.

Contoh:

10.000 saham @ Rp5.000  
10.000 saham @ Rp5.500  
10.000 saham @ Rp6.000

Kemudian Anda menjual 15.000 saham.

Sistem perlu menghitung cost basis berdasarkan metode yang dipilih, misalnya:

* FIFO  
* Average Cost  
* Specific Identification

Ini sangat berguna untuk mendapatkan **realized profit/loss yang akurat**.

---

# **7\. Dividen**

Buat modul khusus untuk dividen.

Data:

* Saham  
* Jumlah saham  
* Dividend per share  
* Gross dividend  
* Pajak  
* Net dividend  
* Ex-date  
* Recording date  
* Payment date  
* Rekening penerima

Laporan:

* Dividen bulan ini  
* Dividen tahun ini  
* Dividen per saham  
* Total dividend income  
* Dividend yield

---

# **8\. Manajemen Obligasi**

Obligasi sebaiknya mempunyai modul tersendiri karena karakteristiknya berbeda dengan saham.

Data:

* Nama obligasi  
* Kode obligasi  
* Penerbit  
* Jenis obligasi  
* Nominal  
* Harga beli  
* Yield  
* Coupon rate  
* Frequency coupon  
* Tanggal beli  
* Settlement date  
* Maturity date  
* Broker/platform  
* Fee  
* Pajak  
* Accrued interest

---

# **9\. Jadwal Kupon Obligasi**

Ini fitur yang sangat berguna.

Misalnya:

> Obligasi A  
>  Nominal: Rp500 juta  
>  Kupon: 6%  
>  Pembayaran: setiap 6 bulan

Sistem otomatis membuat:

| Tanggal | Obligasi | Gross Coupon | Pajak | Net Coupon | Status |
| ----- | ----- | ----- | ----- | ----- | ----- |
| 15 Jan | Obligasi A | Rp15 jt | RpX | RpX | Paid |
| 15 Jul | Obligasi A | Rp15 jt | RpX | RpX | Upcoming |

Dengan demikian dashboard bisa menampilkan:

> **Expected Coupon Next 30 Days: RpXX juta**

---

# **10\. Laporan Laba Rugi per Aset**

Ini salah satu fitur **paling penting** untuk kebutuhan Anda.

Jangan hanya melihat total portfolio profit.

Setiap aset harus mempunyai P/L sendiri.

Contoh:

### **Saham A**

Realized Gain       \+ Rp20 jt  
Unrealized Gain     \+ Rp35 jt  
Dividend            \+ Rp 8 jt  
Trading Fee         \- Rp 2 jt  
\--------------------------------  
Total Return        \+ Rp61 jt

### **Obligasi B**

Capital Gain        \+ Rp 5 jt  
Coupon Income       \+ Rp18 jt  
Accrued Interest    \+ Rp 1 jt  
Fee & Tax           \- Rp 2 jt  
\--------------------------------  
Total Return        \+ Rp22 jt

Kemudian bisa dibuat:

**Asset Performance Report**

| Aset | Capital P/L | Income | Fee/Tax | Total Return |
| ----- | ----- | ----- | ----- | ----- |
| Saham A | \+35 jt | \+8 jt | \-2 jt | \+41 jt |
| Saham B | \-10 jt | \+5 jt | \-1 jt | \-6 jt |
| Obligasi A | \+5 jt | \+18 jt | \-2 jt | \+21 jt |

Ini memungkinkan Anda melihat **kontribusi masing-masing aset terhadap kekayaan Anda** tanpa harus membuat penilaian subjektif terhadap aset tersebut.

---

# **11\. Asset Management**

Selain saham dan obligasi, masukkan seluruh aset personal.

### **Financial Assets**

* Cash  
* Bank  
* Saham  
* Obligasi  
* Deposito  
* Reksa dana  
* ETF  
* Emas

### **Non-Financial Assets**

* Rumah  
* Tanah  
* Kendaraan  
* Properti lainnya

Setiap aset mempunyai:

* Purchase value  
* Acquisition date  
* Current value  
* Valuation date  
* Unrealized gain/loss

---

# **12\. Manajemen Hutang**

Buat modul hutang terpisah.

Data:

* Nama kreditur  
* Jenis hutang  
* Principal awal  
* Outstanding principal  
* Interest rate  
* Tenor  
* Cicilan  
* Tanggal jatuh tempo  
* Tanggal pembayaran  
* Bunga  
* Pokok  
* Status

Contoh:

| Hutang | Outstanding | Cicilan | Jatuh Tempo |
| ----- | ----- | ----- | ----- |
| KPR | Rp450 jt | Rp5 jt | 25 |
| Kredit kendaraan | Rp80 jt | Rp4 jt | 10 |
| Kartu kredit | Rp10 jt | Rp3 jt | 5 |

Dashboard:

* Total hutang  
* Hutang jangka pendek  
* Hutang jangka panjang  
* Total cicilan bulan ini  
* Total interest expense  
* Hutang jatuh tempo 7/30/90 hari

---

# **13\. Balance Sheet / Neraca**

Ini yang akan menghubungkan **aset, hutang, dan ekuitas**.

Rumus:

> **Assets − Liabilities \= Equity**

Contoh:

### **Assets**

* Cash: Rp300 jt  
* Saham: Rp1,2 M  
* Obligasi: Rp900 jt  
* Properti: Rp600 jt

**Total Assets \= Rp3 M**

### **Liabilities**

* KPR: Rp450 jt  
* Kredit: Rp50 jt

**Total Liabilities \= Rp500 jt**

### **Equity**

**Rp3 M − Rp500 jt \= Rp2,5 M**

Laporan ini harus bisa dibuat:

* Harian  
* Bulanan  
* Tahunan  
* Per tanggal tertentu

---

# **14\. Laporan Ekuitas / Net Worth**

Saya sangat menyarankan membuat **Net Worth History**.

Misalnya:

Jan     Rp2,00 M  
Feb     Rp2,08 M  
Mar     Rp2,12 M  
Apr     Rp2,20 M  
Mei     Rp2,28 M  
Jun     Rp2,35 M

Dan sistem menjelaskan perubahan:

Net Worth awal       Rp2,20 M  
Investment return    \+Rp50 jt  
Savings              \+Rp20 jt  
Dividend              \+Rp5 jt  
Debt repayment       \+Rp10 jt  
Asset depreciation    \-Rp5 jt  
\--------------------------------  
Net Worth akhir      Rp2,28 M  
---

# **15\. Cash Flow Statement**

Saya sarankan menggunakan tiga kelompok:

### **Operating Cash Flow**

* Gaji  
* Pendapatan bisnis  
* Pengeluaran rumah  
* Makanan  
* Transportasi  
* Pendidikan  
* Asuransi  
* Pajak  
* Biaya lainnya

### **Investing Cash Flow**

* Pembelian saham  
* Penjualan saham  
* Pembelian obligasi  
* Penjualan obligasi  
* Pembelian properti  
* Penjualan aset  
* Dividen  
* Kupon obligasi

### **Financing Cash Flow**

* Pinjaman  
* Pembayaran pokok hutang  
* Tambahan modal  
* Penarikan dana

Contoh:

| Cash Flow | Bulan |
| ----- | ----- |
| Operating | \+Rp20 jt |
| Investing | \-Rp50 jt |
| Financing | \-Rp5 jt |
| **Net Cash Flow** | **\-Rp35 jt** |

---

# **16\. Income & Expense**

Untuk keuangan personal, tetap perlu modul khusus.

### **Income**

* Gaji  
* Bonus  
* Bisnis  
* Dividen  
* Coupon  
* Bunga deposito  
* Pendapatan lain

### **Expense**

* Rumah  
* Makanan  
* Transportasi  
* Pendidikan  
* Kesehatan  
* Asuransi  
* Entertainment  
* Pajak  
* Interest  
* Fee investasi  
* Biaya bank

Bisa dibuat budget:

> Budget makanan: Rp5 juta  
>  Actual: Rp4,2 juta  
>  Remaining: Rp800 ribu

---

# **17\. Investment Income**

Pisahkan pendapatan investasi menjadi:

* Capital gain  
* Dividend income  
* Coupon income  
* Interest income  
* Other investment income

Jadi Anda bisa melihat:

> **Berapa uang yang benar-benar dihasilkan investasi tanpa harus menjual aset?**

Contohnya:

Dividend             Rp30 jt  
Bond Coupon           Rp45 jt  
Interest               Rp5 jt  
\----------------------------  
Investment Income     Rp80 jt  
---

# **18\. Laporan Portfolio**

Buat beberapa laporan:

### **Portfolio Allocation**

Saham       40%  
Obligasi    35%  
Cash        15%  
Properti    10%

### **Investment Return**

* Return bulan ini  
* Return YTD  
* Return tahunan  
* Realized return  
* Unrealized return  
* Income return

### **Income Projection**

* Expected dividend  
* Expected coupon  
* Expected interest

---

# **19\. Rekonsiliasi**

Fitur ini sangat penting supaya angka sistem tidak berbeda dengan kondisi sebenarnya.

Contoh:

Saldo RDN menurut sistem    Rp150.250.000  
Saldo aktual                Rp150.200.000  
\-------------------------------------------  
Selisih                     Rp50.000

Sistem kemudian membantu mencari:

* Fee belum tercatat  
* Pajak  
* Dividen  
* Coupon  
* Transaksi belum dicatat  
* Kesalahan input

---

# **20\. Laporan yang Sebaiknya Tersedia**

Saya akan membuat minimal **10 laporan**:

1. **Daily Transaction Report**  
2. **Income & Expense Report**  
3. **Profit & Loss Report**  
4. **Asset Performance Report**  
5. **Stock Portfolio Report**  
6. **Bond Portfolio Report**  
7. **Dividend & Coupon Report**  
8. **Debt Report**  
9. **Cash Flow Statement**  
10. **Balance Sheet / Equity Report**

Dan semuanya harus bisa difilter berdasarkan:

* Tanggal  
* Tahun  
* Bulan  
* Rekening  
* Jenis aset  
* Aset tertentu  
* Kategori  
* Broker

---

# **21\. Struktur Menu Aplikasi**

Jika ini akan dibuat sebagai aplikasi, saya menyarankan struktur seperti ini:

Dashboard  
│  
│── Transactions  
│   ├── All Transactions  
│   ├── Income  
│   ├── Expense  
│   └── Transfer  
│  
│── Investments  
│   ├── Portfolio  
│   ├── Stocks  
│   ├── Bonds  
│   ├── Dividends  
│   └── Coupons  
│  
│── Assets  
│   ├── Financial Assets  
│   └── Physical Assets  
│  
├── Liabilities  
│   ├── Loans  
│   ├── Credit Cards  
│   └── Payment Schedule  
│  
├── Planning  
│   ├── Budget  
│   ├── Investment Goals  
│   └── Debt Goals  
│  
└── Reports  
    ├── Profit & Loss  
    ├── Cash Flow  
    ├── Balance Sheet  
    ├── Equity / Net Worth  
    ├── Asset Performance  
    ├── Portfolio  
    ├── Debt  
    └── Tax

## **22\. Satu hal yang sangat saya rekomendasikan**

Kalau Anda benar-benar ingin sistem ini **rapi dan tidak mudah rusak**, jangan membuat setiap laporan menyimpan angka sendiri.

Gunakan konsep **double-entry accounting** di belakang sistem.

Contoh beli saham Rp100 juta:

Investment \- Stock     \+Rp100.000.000  
Cash/RDN               \-Rp100.000.000

Jual saham dengan profit:

Cash/RDN               \+Rp110.000.000  
Investment \- Stock     \-Rp100.000.000  
Realized Gain          \+Rp10.000.000

Dengan begitu satu transaksi bisa otomatis mengalir ke:

**Transaksi → Portfolio → P/L → Cash Flow → Balance Sheet → Equity**

Ini jauh lebih baik daripada membuat angka P/L, aset, cash flow, dan ekuitas secara manual.

### **Prioritas pengembangan**

Kalau sistem ini dibangun bertahap, saya akan prioritaskan:

**Tahap 1**

* Accounts  
* Transactions  
* Income/Expense  
* Assets  
* Liabilities

**Tahap 2**

* Stock portfolio  
* Stock transaction  
* Lot tracking  
* Dividend

**Tahap 3**

* Bond portfolio  
* Coupon schedule  
* Accrued interest

**Tahap 4**

* Double-entry accounting  
* P\&L  
* Balance Sheet  
* Cash Flow  
* Equity

**Tahap 5**

* Dashboard  
* Net worth history  
* Portfolio analytics  
* Budget  
* Forecast  
* Rekonsiliasi

Dengan struktur tersebut, aplikasi Anda nantinya bukan sekadar **“aplikasi pencatat investasi”**, tetapi bisa menjadi **sistem keuangan pribadi terpadu** yang mengetahui posisi **cash, saham, obligasi, aset, hutang, profit/loss, cash flow, dan net worth** secara konsisten.

Tentu. Perbedaan paling sederhananya adalah:

> **Unrealized Gain/Loss \= keuntungan/kerugian yang masih “di atas kertas” karena aset belum dijual.**  
>  **Realized Gain/Loss \= keuntungan/kerugian yang sudah benar-benar terjadi karena aset sudah dijual.**

# **Contoh 1 — Saham naik tetapi belum dijual**

Anda membeli:

* 1.000 saham  
* Harga beli \= Rp5.000  
* Total modal \= **Rp5.000.000**

Kemudian harga saham naik menjadi Rp6.000.

Nilai saham sekarang:

**1.000 × Rp6.000 \= Rp6.000.000**

Keuntungan:

**Rp6.000.000 − Rp5.000.000 \= Rp1.000.000**

Tetapi Anda **belum menjual sahamnya**.

Maka:

|  | Nilai |
| ----- | ----- |
| Modal | Rp5.000.000 |
| Nilai sekarang | Rp6.000.000 |
| **Unrealized Gain** | **\+Rp1.000.000** |
| Realized Gain | Rp0 |

Kenapa unrealized? Karena harga bisa besok naik menjadi Rp6.500 atau turun menjadi Rp4.500. Keuntungan Rp1 juta tersebut belum benar-benar dikunci.

---

# **Contoh 2 — Saham kemudian dijual**

Anda menjual 1.000 saham tersebut pada harga Rp6.000.

Uang yang diterima:

**1.000 × Rp6.000 \= Rp6.000.000**

Modal awal:

**Rp5.000.000**

Maka keuntungan:

**Rp6.000.000 − Rp5.000.000 \= Rp1.000.000**

Sekarang:

|  | Nilai |
| ----- | ----- |
| Modal | Rp5.000.000 |
| Harga jual | Rp6.000.000 |
| **Realized Gain** | **\+Rp1.000.000** |
| Unrealized Gain | Rp0 |

Karena sahamnya sudah dijual, keuntungan tersebut berubah dari **unrealized** menjadi **realized**.

---

# **Contoh 3 — Justru saham turun**

Anda membeli saham:

**1.000 × Rp5.000 \= Rp5.000.000**

Harga sekarang turun menjadi Rp4.000.

Nilai sekarang:

**1.000 × Rp4.000 \= Rp4.000.000**

Maka:

**Unrealized Loss \= Rp4.000.000 − Rp5.000.000 \= \-Rp1.000.000**

Tetapi Anda belum menjual.

Jadi:

> **Unrealized Loss \= \-Rp1 juta**

Kalau kemudian Anda menjual di Rp4.000:

> **Realized Loss \= \-Rp1 juta**

---

# **Contoh yang lebih menarik untuk dashboard Anda**

Misalkan portfolio Anda:

| Saham | Modal | Nilai Sekarang | Unrealized P/L |
| ----- | ----- | ----- | ----- |
| Saham A | Rp100 jt | Rp120 jt | **\+Rp20 jt** |
| Saham B | Rp150 jt | Rp130 jt | **\-Rp20 jt** |
| Saham C | Rp50 jt | Rp60 jt | **\+Rp10 jt** |
| **Total** | **Rp300 jt** | **Rp310 jt** | **\+Rp10 jt** |

Artinya portfolio Anda secara nilai **sedang untung Rp10 juta**, tetapi keuntungan tersebut belum seluruhnya direalisasikan.

Kemudian Anda menjual Saham A:

**Modal Saham A \= Rp100 juta**  
**Harga jual \= Rp120 juta**

Maka:

**Realized Gain Saham A \= \+Rp20 juta**

Saham B dan C masih Anda pegang, sehingga:

* Saham A → **Realized Gain \+Rp20 jt**  
* Saham B → **Unrealized Loss \-Rp20 jt**  
* Saham C → **Unrealized Gain \+Rp10 jt**

Jadi dashboard bisa menunjukkan:

## **Investment Performance**

| Komponen | Nilai |
| :---- | :---- |
| Realized Gain/Loss | **\+Rp20 jt** |
| Unrealized Gain/Loss | **\-Rp10 jt** |
| Dividend | **\+Rp5 jt** |
| Investment Fees | **\-Rp1 jt** |
| **Total Investment Return** | **\+Rp14 jt** |

---

## **Bedakan juga dengan Net Cash Flow**

Ini penting untuk sistem yang sedang kita desain.

Misalnya Anda membeli saham Rp100 juta.

Cash                 \-Rp100 jt  
Investment Asset     \+Rp100 jt  
Net Cash Flow        \-Rp100 jt  
Realized P/L            Rp0  
Unrealized P/L           Rp0

Harga saham kemudian naik menjadi Rp120 juta:

Cash                  Rp0 perubahan  
Investment Asset     \+Rp20 jt nilai  
Unrealized Gain      \+Rp20 jt  
Realized Gain           Rp0

Kemudian saham dijual Rp120 juta:

Cash                 \+Rp120 jt  
Investment Asset     \-Rp120 jt  
Realized Gain         \+Rp20 jt  
Unrealized Gain          Rp0

**Jadi ketiganya harus dipisahkan dalam sistem:**

> **Net Cash Flow** → pergerakan uang kas  
>  **Unrealized Gain/Loss** → perubahan nilai aset yang belum dijual  
>  **Realized Gain/Loss** → keuntungan/kerugian dari aset yang sudah dijual

Untuk aplikasi Anda, saya juga menyarankan **dividen dan kupon obligasi dipisahkan dari realized gain**, karena keduanya merupakan **investment income**, bukan capital gain.

