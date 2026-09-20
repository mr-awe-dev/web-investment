package com.example.personalfinance.config;

import com.example.personalfinance.domain.account.AccountCategory;
import com.example.personalfinance.domain.asset.AssetType;
import com.example.personalfinance.domain.asset.QuantityUnit;
import com.example.personalfinance.domain.bond.CouponFrequency;
import com.example.personalfinance.domain.liability.LiabilityType;
import com.example.personalfinance.domain.transaction.TransactionType;
import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.dto.request.*;
import com.example.personalfinance.repository.UserRepository;
import com.example.personalfinance.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static com.example.personalfinance.domain.transaction.TransactionType.*;

/**
 * Seeds a realistic Indonesian demo portfolio (demo@finance.id / Demo1234!) through the regular services,
 * so every seeded number is produced by the accounting engine. Idempotent.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed-demo-data", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

    public static final String EMAIL = "demo@finance.id";
    public static final String PASSWORD = "Demo1234!";

    private final UserRepository users;
    private final AuthService auth;
    private final AccountService accounts;
    private final AssetService assets;
    private final LiabilityService liabilities;
    private final TransactionService transactions;
    private final ChartOfAccountService coa;
    private final BondService bonds;
    private final BudgetService budgets;

    @Override
    public void run(ApplicationArguments args) {
        if (users.existsByEmailIgnoreCase(EMAIL)) return;
        User u = users.findById(auth.register(new RegisterRequest(EMAIL, PASSWORD, "Demo Investor")).user().id()).orElseThrow();
        LocalDate d = LocalDate.now().withDayOfMonth(1).minusMonths(5);

        Long bca = accounts.create(u, new AccountRequest("BCA Tahapan", AccountCategory.BANK, "IDR", "BCA")).id();
        Long mandiri = accounts.create(u, new AccountRequest("Mandiri Payroll", AccountCategory.BANK, "IDR", "Mandiri")).id();
        Long rdn = accounts.create(u, new AccountRequest("RDN Sekuritas A", AccountCategory.RDN, "IDR", "Stockbit Sekuritas")).id();
        Long kas = accounts.create(u, new AccountRequest("Kas", AccountCategory.CASH, "IDR", null)).id();
        accounts.create(u, new AccountRequest("E-Wallet", AccountCategory.EWALLET, "IDR", "GoPay"));

        Long bbca = assets.create(u, new AssetRequest("BBCA", "Bank Central Asia", AssetType.STOCK, "IDR", QuantityUnit.SHARE, bd("10250"), "Keuangan")).id();
        Long bbri = assets.create(u, new AssetRequest("BBRI", "Bank Rakyat Indonesia", AssetType.STOCK, "IDR", QuantityUnit.SHARE, bd("4650"), "Keuangan")).id();
        Long tlkm = assets.create(u, new AssetRequest("TLKM", "Telkom Indonesia", AssetType.STOCK, "IDR", QuantityUnit.SHARE, bd("2900"), "Telekomunikasi")).id();
        Long ori = assets.create(u, new AssetRequest("ORI024", "Obligasi Negara Ritel 024", AssetType.BOND, "IDR", QuantityUnit.UNIT, bd("1000000"), "Pemerintah")).id();
        Long emas = assets.create(u, new AssetRequest("XAU", "Emas Antam", AssetType.GOLD, "IDR", QuantityUnit.GRAM, bd("1450000"), "Komoditas")).id();
        Long mobil = assets.create(u, new AssetRequest("CAR-01", "Toyota Avanza 2022", AssetType.VEHICLE, "IDR", QuantityUnit.UNIT, bd("190000000"), null)).id();
        Long kpr = liabilities.create(u, new LiabilityRequest("KPR Rumah", "Bank BTN", LiabilityType.LOAN, "IDR", bd("8.5"), 180, bd("5500000"), LocalDate.now().plusDays(12))).id();

        Map<String, Long> cat = Map.of("gaji", coa.byCode(u, "4100").getId(), "makan", coa.byCode(u, "5100").getId(),
                "rumah", coa.byCode(u, "5200").getId(), "transport", coa.byCode(u, "5600").getId(), "lain", coa.byCode(u, "5700").getId());

        post(u, d, OPENING_BALANCE, bca, null, null, null, null, null, null, null, bd("85000000"), null, null, null, "Saldo awal BCA");
        post(u, d, OPENING_BALANCE, mandiri, null, null, null, null, null, null, null, bd("15000000"), null, null, null, "Saldo awal Mandiri");
        post(u, d, OPENING_BALANCE, kas, null, null, null, null, null, null, null, bd("2500000"), null, null, null, "Saldo awal kas");
        post(u, d.plusDays(2), LOAN, bca, null, null, null, kpr, null, null, null, bd("450000000"), null, null, null, "Pencairan KPR");
        post(u, d.plusDays(3), ASSET_PURCHASE, bca, null, null, mobil, null, bd("1"), QuantityUnit.UNIT, bd("210000000"), null, null, null, null, "Pembelian kendaraan");
        post(u, d.plusDays(5), TRANSFER, bca, rdn, null, null, null, null, null, null, bd("60000000"), null, null, null, "Top up RDN");
        post(u, d.plusDays(6), BUY_INVESTMENT, rdn, null, null, bbca, null, bd("2000"), QuantityUnit.SHARE, bd("9800"), bd("29400"), null, null, null, "Beli BBCA lot 1");
        post(u, d.plusDays(8), BUY_INVESTMENT, rdn, null, null, bbri, null, bd("5000"), QuantityUnit.SHARE, bd("4400"), bd("33000"), null, null, null, "Beli BBRI");
        post(u, d.plusDays(10), BUY_INVESTMENT, bca, null, null, ori, null, bd("20"), QuantityUnit.UNIT, bd("1000000"), null, null, null, null, "Beli ORI024");
        post(u, d.plusDays(12), ASSET_PURCHASE, bca, null, null, emas, null, bd("25"), QuantityUnit.GRAM, bd("1320000"), null, null, null, null, "Beli emas Antam");
        for (int m = 0; m < 6; m++) {
            LocalDate md = d.plusMonths(m);
            post(u, md.plusDays(24), INCOME, mandiri, null, cat.get("gaji"), null, null, null, null, null, bd("25000000"), null, bd("1250000"), null, "Gaji bulanan");
            post(u, md.plusDays(3), EXPENSE, kas, null, cat.get("makan"), null, null, null, null, null, bd("3200000"), null, null, null, "Belanja & makan");
            post(u, md.plusDays(5), EXPENSE, bca, null, cat.get("rumah"), null, null, null, null, null, bd("2100000"), null, null, null, "Listrik, air, internet");
            post(u, md.plusDays(7), EXPENSE, kas, null, cat.get("transport"), null, null, null, null, null, bd("1100000"), null, null, null, "Transportasi");
            post(u, md.plusDays(15), DEBT_PAYMENT, bca, null, null, null, kpr, null, null, null, bd("2400000"), null, null, bd("3100000"), "Cicilan KPR");
            post(u, md.plusDays(26), TRANSFER, mandiri, kas, null, null, null, null, null, null, bd("4000000"), null, null, null, "Tarik tunai");
        }
        post(u, d.plusMonths(1).plusDays(9), BUY_INVESTMENT, rdn, null, null, bbca, null, bd("1000"), QuantityUnit.SHARE, bd("10100"), bd("15150"), null, null, null, "Beli BBCA lot 2");
        post(u, d.plusMonths(1).plusDays(20), BUY_INVESTMENT, rdn, null, null, tlkm, null, bd("10000"), QuantityUnit.SHARE, bd("3100"), bd("46500"), null, null, null, "Beli TLKM");
        post(u, d.plusMonths(2).plusDays(4), DIVIDEND, rdn, null, null, bbca, null, bd("3000"), QuantityUnit.SHARE, bd("135"), null, null, bd("40500"), null, "Dividen final BBCA");
        post(u, d.plusMonths(2).plusDays(15), COUPON, bca, null, null, ori, null, null, null, null, bd("108333"), null, bd("10833"), null, "Kupon ORI024");
        post(u, d.plusMonths(3).plusDays(2), SELL_INVESTMENT, rdn, null, null, bbca, null, bd("1500"), QuantityUnit.SHARE, bd("10400"), bd("23400"), null, bd("15600"), null, "Jual sebagian BBCA");
        post(u, d.plusMonths(3).plusDays(18), DIVIDEND, rdn, null, null, bbri, null, bd("5000"), QuantityUnit.SHARE, bd("135"), null, null, bd("67500"), null, "Dividen BBRI");
        post(u, d.plusMonths(4).plusDays(11), SELL_INVESTMENT, rdn, null, null, tlkm, null, bd("4000"), QuantityUnit.SHARE, bd("2950"), bd("17700"), null, bd("11800"), null, "Jual sebagian TLKM");
        post(u, d.plusMonths(4).plusDays(20), INTEREST, bca, null, null, null, null, null, null, null, bd("185000"), null, bd("37000"), null, "Bunga tabungan");
        post(u, d.plusMonths(5).plusDays(2), FEE, rdn, null, null, null, null, null, null, null, bd("25000"), null, null, null, "Biaya admin RDN");

        bonds.create(u, new BondRequest(ori, "Pemerintah RI", "ORI", bd("20000000"), bd("6.5"), bd("10"), CouponFrequency.MONTHLY, d.plusDays(10), d.plusDays(10).plusYears(3)));
        String period = LocalDate.now().toString().substring(0, 7);
        budgets.upsert(u, new BudgetRequest(cat.get("makan"), period, bd("3500000")));
        budgets.upsert(u, new BudgetRequest(cat.get("rumah"), period, bd("2000000")));
        budgets.upsert(u, new BudgetRequest(cat.get("transport"), period, bd("1500000")));
        log.info("Demo data seeded for {}", EMAIL);
    }

    private void post(User u, LocalDate date, TransactionType type, Long account, Long dest, Long category, Long asset, Long liability,
                      BigDecimal qty, QuantityUnit unit, BigDecimal price, BigDecimal gross, BigDecimal brokerFee, BigDecimal tax,
                      BigDecimal interest, String description) {
        transactions.create(u, new TransactionRequest(date, type, account, dest, category, asset, liability, qty, unit, price, gross,
                null, brokerFee, null, tax, interest, null, null, null, description, null));
    }

    private static BigDecimal bd(String v) { return new BigDecimal(v); }
}
