package com.example.personalfinance.domain.accounting;

import java.util.List;

/** Well-known system account codes and the default template seeded for every new user. */
public final class ChartOfAccountsTemplate {
    public static final String CASH = "1100", BANK = "1200", RDN = "1300", STOCKS = "1400", BONDS = "1500",
            DEPOSITS = "1600", PROPERTY = "1700", OTHER_ASSETS = "1800",
            LOANS = "2100", CREDIT_CARDS = "2200", OTHER_DEBT = "2300",
            OWNER_EQUITY = "3100", RETAINED = "3200",
            SALARY = "4100", DIVIDEND_INCOME = "4200", COUPON_INCOME = "4300", INTEREST_INCOME = "4400",
            REALIZED_GAIN = "4500", OTHER_INCOME = "4600",
            FOOD = "5100", HOUSING = "5200", INTEREST_EXPENSE = "5300", INVESTMENT_FEE = "5400", TAX = "5500",
            TRANSPORT = "5600", OTHER_EXPENSE = "5700";

    /** code, name, type, parentCode, cash */
    public record Row(String code, String name, LedgerType type, String parentCode, boolean cash) {}

    public static final List<Row> ROWS = List.of(
            new Row("1000", "Aset", LedgerType.ASSET, null, false),
            new Row(CASH, "Kas", LedgerType.ASSET, "1000", true),
            new Row(BANK, "Bank", LedgerType.ASSET, "1000", true),
            new Row(RDN, "RDN", LedgerType.ASSET, "1000", true),
            new Row(STOCKS, "Saham", LedgerType.ASSET, "1000", false),
            new Row(BONDS, "Obligasi", LedgerType.ASSET, "1000", false),
            new Row(DEPOSITS, "Deposito", LedgerType.ASSET, "1000", true),
            new Row(PROPERTY, "Properti", LedgerType.ASSET, "1000", false),
            new Row(OTHER_ASSETS, "Aset Lainnya", LedgerType.ASSET, "1000", false),
            new Row("2000", "Liabilitas", LedgerType.LIABILITY, null, false),
            new Row(LOANS, "Pinjaman", LedgerType.LIABILITY, "2000", false),
            new Row(CREDIT_CARDS, "Kartu Kredit", LedgerType.LIABILITY, "2000", false),
            new Row(OTHER_DEBT, "Utang Lainnya", LedgerType.LIABILITY, "2000", false),
            new Row("3000", "Ekuitas", LedgerType.EQUITY, null, false),
            new Row(OWNER_EQUITY, "Modal Pemilik", LedgerType.EQUITY, "3000", false),
            new Row(RETAINED, "Laba Ditahan", LedgerType.EQUITY, "3000", false),
            new Row("4000", "Pendapatan", LedgerType.INCOME, null, false),
            new Row(SALARY, "Gaji", LedgerType.INCOME, "4000", false),
            new Row(DIVIDEND_INCOME, "Pendapatan Dividen", LedgerType.INCOME, "4000", false),
            new Row(COUPON_INCOME, "Pendapatan Kupon", LedgerType.INCOME, "4000", false),
            new Row(INTEREST_INCOME, "Pendapatan Bunga", LedgerType.INCOME, "4000", false),
            new Row(REALIZED_GAIN, "Laba Realisasi", LedgerType.INCOME, "4000", false),
            new Row(OTHER_INCOME, "Pendapatan Lainnya", LedgerType.INCOME, "4000", false),
            new Row("5000", "Beban", LedgerType.EXPENSE, null, false),
            new Row(FOOD, "Makanan", LedgerType.EXPENSE, "5000", false),
            new Row(HOUSING, "Perumahan", LedgerType.EXPENSE, "5000", false),
            new Row(INTEREST_EXPENSE, "Beban Bunga", LedgerType.EXPENSE, "5000", false),
            new Row(INVESTMENT_FEE, "Biaya Investasi", LedgerType.EXPENSE, "5000", false),
            new Row(TAX, "Pajak", LedgerType.EXPENSE, "5000", false),
            new Row(TRANSPORT, "Transportasi", LedgerType.EXPENSE, "5000", false),
            new Row(OTHER_EXPENSE, "Beban Lainnya", LedgerType.EXPENSE, "5000", false));

    private ChartOfAccountsTemplate() {}
}
