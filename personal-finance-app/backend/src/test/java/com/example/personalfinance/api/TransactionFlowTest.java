package com.example.personalfinance.api;

import com.example.personalfinance.support.ApiTestBase;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/** End-to-end accounting flow through the REST API: every transaction type, invariants, update/void, filters and export. */
class TransactionFlowTest extends ApiTestBase {

    String token;
    long bank, rdn, cash, bbca, gold, loan, salaryCat, foodCat;

    @BeforeEach
    void setUp() throws Exception {
        token = registerAndLogin("flow-" + System.nanoTime() + "@test.id");
        bank = createAccount(token, "Bank BCA", "BANK");
        rdn = createAccount(token, "RDN", "RDN");
        cash = createAccount(token, "Kas", "CASH");
        bbca = createAsset(token, "BBCA", "STOCK", "SHARE", "10000");
        gold = createAsset(token, "GOLD", "GOLD", "GRAM", "1000000");
        loan = data(post("/api/liabilities"), token, Map.of("name", "KTA", "liabilityType", "LOAN", "currency", "IDR", "interestRate", 10), 201).path("id").asLong();
        salaryCat = categoryId(token, "4100");
        foodCat = categoryId(token, "5100");
    }

    private JsonNode submit(Tx tx) throws Exception { return data(post("/api/transactions"), token, tx.build(), 201); }
    private String reject(Tx tx, int status) throws Exception { return errorCode(post("/api/transactions"), token, tx.build(), status); }

    private BigDecimal balance(long accountId) throws Exception { return dec(data(get("/api/accounts/" + accountId), token, null, 200).path("balance")); }
    private JsonNode balanceSheet() throws Exception { return data(get("/api/reports/balance-sheet"), token, null, 200); }

    @Test
    void fullLifecycleKeepsLedgerBalancedAndDerivesEveryReport() throws Exception {
        // Opening balance: Dr Bank / Cr Owner Equity
        submit(Tx.of("OPENING_BALANCE", "2026-01-01", bank).amount("100000000"));
        assertThat(balance(bank)).isEqualByComparingTo("100000000.00");

        // Transfer Bank -> RDN must not change net worth
        BigDecimal nwBefore = dec(balanceSheet().path("equity"));
        submit(Tx.of("TRANSFER", "2026-01-02", bank).set("destinationAccountId", rdn).amount("40000000").set("adminFee", 2500));
        assertThat(balance(bank)).isEqualByComparingTo("59997500.00");
        assertThat(balance(rdn)).isEqualByComparingTo("40000000.00");
        assertThat(dec(balanceSheet().path("equity"))).isEqualByComparingTo(nwBefore.subtract(new BigDecimal("2500")));

        // Buy BBCA: 1000 @ 9000 + fees 20000 => lot cost 9,020,000
        JsonNode buy = submit(Tx.of("BUY_INVESTMENT", "2026-01-05", rdn).set("assetId", bbca).qty("1000", "SHARE", "9000").set("brokerFee", 15000).set("levy", 5000).set("reference", "ORD-1"));
        assertThat(dec(buy.path("transaction").path("netAmount"))).isEqualByComparingTo("9020000.00");
        assertThat(buy.path("journalEntries")).hasSize(2);
        assertThat(dec(buy.path("portfolioQuantityImpact"))).isEqualByComparingTo("1000");
        assertThat(dec(buy.path("cashFlowImpact"))).isEqualByComparingTo("-9020000.00");
        assertThat(buy.path("cashFlowCategory").asText()).isEqualTo("INVESTING");
        long buyId = buy.path("transaction").path("id").asLong();
        submit(Tx.of("BUY_INVESTMENT", "2026-01-06", rdn).set("assetId", bbca).qty("500", "SHARE", "9500"));

        // Unrealized P/L: price 10000 => market 15,000,000 ; cost 13,770,000
        JsonNode portfolio = data(get("/api/portfolio"), token, null, 200);
        assertThat(dec(portfolio.path("marketValue"))).isEqualByComparingTo("15000000.00");
        assertThat(dec(portfolio.path("totalCost"))).isEqualByComparingTo("13770000.00");
        assertThat(dec(portfolio.path("unrealizedPl"))).isEqualByComparingTo("1230000.00");
        assertThat(portfolio.path("positions")).hasSize(1);
        assertThat(dec(data(get("/api/reports/cash-flow?from=2026-01-01&to=2026-12-31"), token, null, 200).path("investing"))).isEqualByComparingTo("-13770000.00");

        // Sell 1200 FIFO: 1000 @ 9020 + 200 @ 9500 = 10,920,000 cost; proceeds 1200*10500 = 12,600,000 ; fee 10000, tax 5000
        JsonNode sell = submit(Tx.of("SELL_INVESTMENT", "2026-02-01", rdn).set("assetId", bbca).qty("1200", "SHARE", "10500").set("brokerFee", 10000).set("tax", 5000).set("description", "Jual, sebagian \"BBCA\""));
        JsonNode st = sell.path("transaction");
        assertThat(dec(st.path("costBasis"))).isEqualByComparingTo("10920000.00");
        assertThat(dec(st.path("realizedPl"))).isEqualByComparingTo("1680000.00");
        assertThat(dec(st.path("netAmount"))).isEqualByComparingTo("12585000.00");
        assertThat(sell.path("lotConsumptions")).hasSize(2);
        assertThat(dec(sell.path("portfolioQuantityImpact"))).isEqualByComparingTo("-1200");
        assertThat(sell.path("journalEntries")).hasSize(5);
        long sellId = st.path("id").asLong();

        // Lots: first closed, second partial
        JsonNode lots = data(get("/api/portfolio/lots?assetId=" + bbca), token, null, 200);
        assertThat(lots.get(0).path("status").asText()).isEqualTo("CLOSED");
        assertThat(lots.get(1).path("status").asText()).isEqualTo("PARTIAL");
        assertThat(dec(lots.get(1).path("remainingQuantity"))).isEqualByComparingTo("300");
        assertThat(data(get("/api/portfolio/lots"), token, null, 200)).hasSize(2);

        // Buying tx whose lot is consumed cannot be changed
        assertThat(errorCode(delete("/api/transactions/" + buyId), token, null, 400)).isEqualTo("LOT_CONSUMED");

        // Dividend: gross 300*100=30,000 tax 3,000 => cash +27,000, income 30,000
        JsonNode div = submit(Tx.of("DIVIDEND", "2026-02-10", rdn).set("assetId", bbca).qty("300", "SHARE", "100").set("tax", 3000));
        assertThat(dec(div.path("cashFlowImpact"))).isEqualByComparingTo("27000.00");
        assertThat(div.path("journalEntries")).hasSize(3);
        submit(Tx.of("COUPON", "2026-02-11", bank).set("assetId", gold).amount("500000").set("tax", 50000));
        submit(Tx.of("INTEREST", "2026-02-12", bank).amount("100000"));

        // Income & expense, fee, tax
        submit(Tx.of("INCOME", "2026-02-25", bank).set("categoryId", salaryCat).amount("20000000").set("tax", 1000000));
        submit(Tx.of("EXPENSE", "2026-02-26", cash).set("categoryId", foodCat).amount("500000").set("adminFee", 1000).set("tax", 500));
        submit(Tx.of("FEE", "2026-02-27", rdn).amount("25000").set("description", "Biaya \"admin\""));
        submit(Tx.of("TAX", "2026-02-28", bank).amount("75000"));

        // Loan then debt payment with principal + interest
        submit(Tx.of("LOAN", "2026-03-01", bank).set("liabilityId", loan).amount("50000000"));
        JsonNode liab = data(get("/api/liabilities"), token, null, 200).get(0);
        assertThat(dec(liab.path("outstanding"))).isEqualByComparingTo("50000000.00");
        assertThat(liab.path("status").asText()).isEqualTo("ACTIVE");
        JsonNode pay = submit(Tx.of("DEBT_PAYMENT", "2026-03-15", bank).set("liabilityId", loan).amount("4000000").set("interestAmount", 1000000).set("adminFee", 5000));
        assertThat(dec(pay.path("transaction").path("netAmount"))).isEqualByComparingTo("5005000.00");
        assertThat(pay.path("journalEntries")).hasSize(4);
        assertThat(dec(data(get("/api/liabilities"), token, null, 200).get(0).path("outstanding"))).isEqualByComparingTo("46000000.00");
        assertThat(reject(Tx.of("DEBT_PAYMENT", "2026-03-16", bank).set("liabilityId", loan).amount("99000000"), 400)).isEqualTo("DEBT_EXCEEDED");

        // Asset purchase / sale at break-even and at a loss (gold)
        submit(Tx.of("ASSET_PURCHASE", "2026-03-20", bank).set("assetId", gold).qty("10", "GRAM", "1000000"));
        JsonNode even = submit(Tx.of("ASSET_SALE", "2026-03-21", bank).set("assetId", gold).qty("4", "GRAM", "1000000"));
        assertThat(dec(even.path("realizedPl"))).isZero();
        assertThat(even.path("journalEntries")).hasSize(2);
        JsonNode loss = submit(Tx.of("ASSET_SALE", "2026-03-22", bank).set("assetId", gold).qty("2", "GRAM", "900000"));
        assertThat(dec(loss.path("realizedPl"))).isEqualByComparingTo("-200000.00");

        // Foreign currency transaction is converted to base with the rate
        JsonNode fx = submit(Tx.of("INCOME", "2026-03-25", bank).set("categoryId", salaryCat).amount("1000").set("currency", "usd").set("exchangeRate", 16000));
        assertThat(dec(fx.path("transaction").path("baseAmount"))).isEqualByComparingTo("16000000.00");
        assertThat(dec(fx.path("journalEntries").get(0).path("debit"))).isEqualByComparingTo("16000000.00");

        // Balance sheet invariant and net worth
        JsonNode bs = balanceSheet();
        assertThat(bs.path("balanced").asBoolean()).isTrue();
        assertThat(dec(bs.path("equity"))).isEqualByComparingTo(dec(bs.path("totalAssets")).subtract(dec(bs.path("totalLiabilities"))));
        assertThat(dec(bs.path("totalLiabilities"))).isEqualByComparingTo("46000000.00");
        JsonNode nw = data(get("/api/reports/net-worth/current"), token, null, 200);
        assertThat(dec(nw.path("netWorth"))).isEqualByComparingTo(dec(bs.path("equity")));
        JsonNode history = data(get("/api/reports/net-worth"), token, null, 200);
        assertThat(history).hasSize(3);
        assertThat(dec(history.get(2).path("netWorth"))).isEqualByComparingTo(dec(bs.path("equity")));

        // Income statement & investment income
        JsonNode pl = data(get("/api/reports/income-expense?from=2026-01-01&to=2026-12-31"), token, null, 200);
        assertThat(dec(pl.path("totalIncome"))).isEqualByComparingTo("38110000.00");
        JsonNode inv = data(get("/api/reports/investment-income?from=2026-01-01&to=2026-12-31"), token, null, 200);
        assertThat(dec(inv.path("dividendIncome"))).isEqualByComparingTo("30000.00");
        assertThat(dec(inv.path("couponIncome"))).isEqualByComparingTo("500000.00");
        assertThat(dec(inv.path("realizedPl"))).isEqualByComparingTo("1480000.00");
        data(get("/api/reports/portfolio-performance"), token, null, 200);
        data(get("/api/reports/investment-income"), token, null, 200);
        data(get("/api/reports/income-expense"), token, null, 200);
        data(get("/api/reports/cash-flow"), token, null, 200);
        data(get("/api/reports/balance-sheet?asOf=2026-01-31"), token, null, 200);
        JsonNode cf = data(get("/api/reports/cash-flow?from=2026-01-01&to=2026-12-31"), token, null, 200);
        assertThat(dec(cf.path("netCashFlow"))).isEqualByComparingTo(dec(cf.path("operating")).add(dec(cf.path("investing"))).add(dec(cf.path("financing"))));
        assertThat(dec(cf.path("financing"))).isEqualByComparingTo("144995000.00");

        // Listing, filters, pagination, detail
        JsonNode page = data(get("/api/transactions?page=0&size=5"), token, null, 200);
        assertThat(page.path("content")).hasSize(5);
        assertThat(page.path("totalElements").asLong()).isEqualTo(18);
        assertThat(data(get("/api/transactions?type=DIVIDEND&accountId=" + rdn + "&assetId=" + bbca + "&from=2026-01-01&to=2026-12-31&search=" ), token, null, 200).path("totalElements").asLong()).isEqualTo(1);
        assertThat(data(get("/api/transactions?search=ord-1"), token, null, 200).path("totalElements").asLong()).isEqualTo(1);
        assertThat(data(get("/api/transactions/" + sellId), token, null, 200).path("lotConsumptions")).hasSize(2);
        assertThat(data(get("/api/dividends"), token, null, 200)).hasSize(1);
        assertThat(data(get("/api/bonds/coupons/history"), token, null, 200)).hasSize(1);
        assertThat(data(get("/api/stocks"), token, null, 200)).hasSize(1);
        assertThat(data(get("/api/assets"), token, null, 200)).hasSize(2);
        JsonNode positions = data(get("/api/portfolio/positions"), token, null, 200);
        assertThat(positions).hasSize(2);
        String csv = mvc.perform(get("/api/transactions/export?type=SELL_INVESTMENT").header("Authorization", "Bearer " + token))
                .andReturn().getResponse().getContentAsString();
        assertThat(csv).contains("\"Jual, sebagian \"\"BBCA\"\"\"").hasLineCount(2);
        String all = mvc.perform(get("/api/transactions/export").header("Authorization", "Bearer " + token)).andReturn().getResponse().getContentAsString();
        assertThat(all).hasLineCount(19).contains("\"Biaya \"\"admin\"\"\"");

        // Update the sale (re-post) then void it: lots are restored
        JsonNode updated = data(put("/api/transactions/" + sellId), token,
                Tx.of("SELL_INVESTMENT", "2026-02-01", rdn).set("assetId", bbca).qty("1000", "SHARE", "10500").build(), 200);
        assertThat(dec(updated.path("transaction").path("costBasis"))).isEqualByComparingTo("9020000.00");
        call(delete("/api/transactions/" + sellId), token, null, 200);
        assertThat(errorCode(delete("/api/transactions/" + sellId), token, null, 400)).isEqualTo("TRANSACTION_VOID");
        JsonNode voided = data(get("/api/transactions/" + sellId), token, null, 200);
        assertThat(voided.path("transaction").path("status").asText()).isEqualTo("VOID");
        assertThat(voided.path("journalEntries")).isEmpty();
        assertThat(dec(data(get("/api/portfolio"), token, null, 200).path("positions").get(0).path("quantity"))).isEqualByComparingTo("1500");
        assertThat(balanceSheet().path("balanced").asBoolean()).isTrue();

        // Update / void of a plain expense and of an unconsumed purchase
        long expenseId = data(get("/api/transactions?type=EXPENSE"), token, null, 200).path("content").get(0).path("id").asLong();
        data(put("/api/transactions/" + expenseId), token, Tx.of("EXPENSE", "2026-02-26", cash).set("categoryId", foodCat).amount("750000").build(), 200);
        long goldBuy = data(get("/api/transactions?type=ASSET_PURCHASE"), token, null, 200).path("content").get(0).path("id").asLong();
        call(delete("/api/transactions/" + goldBuy), token, null, 400);
        long freshBuy = submit(Tx.of("BUY_INVESTMENT", "2026-04-01", rdn).set("assetId", bbca).qty("10", "SHARE", "9000")).path("transaction").path("id").asLong();
        call(delete("/api/transactions/" + freshBuy), token, null, 200);
        assertThat(data(get("/api/portfolio/lots?assetId=" + bbca), token, null, 200)).hasSize(2);
    }

    @Test
    void averageAndSpecificCostBasisMethods() throws Exception {
        submit(Tx.of("OPENING_BALANCE", "2026-01-01", rdn).amount("50000000"));
        long lot1 = submit(Tx.of("BUY_INVESTMENT", "2026-01-02", rdn).set("assetId", bbca).qty("100", "SHARE", "10000")).path("transaction").path("id").asLong();
        submit(Tx.of("BUY_INVESTMENT", "2026-01-03", rdn).set("assetId", bbca).qty("100", "SHARE", "12000"));
        JsonNode lots = data(get("/api/portfolio/lots?assetId=" + bbca), token, null, 200);
        long lot2Id = lots.get(1).path("id").asLong();
        assertThat(lots.get(0).path("transactionId").asLong()).isEqualTo(lot1);

        data(put("/api/auth/settings"), token, Map.of("baseCurrency", "IDR", "costBasisMethod", "AVERAGE", "fullName", "T"), 200);
        JsonNode avg = submit(Tx.of("SELL_INVESTMENT", "2026-01-10", rdn).set("assetId", bbca).qty("50", "SHARE", "13000"));
        assertThat(dec(avg.path("transaction").path("costBasis"))).isEqualByComparingTo("550000.00");

        data(put("/api/auth/settings"), token, Map.of("baseCurrency", "IDR", "costBasisMethod", "SPECIFIC", "fullName", "T"), 200);
        assertThat(reject(Tx.of("SELL_INVESTMENT", "2026-01-11", rdn).set("assetId", bbca).qty("10", "SHARE", "13000"), 400)).isEqualTo("LOT_REQUIRED");
        assertThat(reject(Tx.of("SELL_INVESTMENT", "2026-01-11", rdn).set("assetId", bbca).qty("10", "SHARE", "13000").set("lotIds", List.of(999_999)), 400)).isEqualTo("LOT_NOT_AVAILABLE");
        assertThat(reject(Tx.of("SELL_INVESTMENT", "2026-01-11", rdn).set("assetId", bbca).qty("120", "SHARE", "13000").set("lotIds", List.of(lot2Id)), 400)).isEqualTo("INSUFFICIENT_STOCK");
        JsonNode spec = submit(Tx.of("SELL_INVESTMENT", "2026-01-11", rdn).set("assetId", bbca).qty("40", "SHARE", "13000").set("lotIds", List.of(lot2Id)));
        assertThat(spec.path("lotConsumptions").get(0).path("lotId").asLong()).isEqualTo(lot2Id);
        assertThat(dec(spec.path("transaction").path("costBasis"))).isEqualByComparingTo("480000.00");
        assertThat(reject(Tx.of("SELL_INVESTMENT", "2026-01-12", rdn).set("assetId", bbca).qty("500", "SHARE", "13000").set("lotIds", List.of(lot2Id)), 400)).isEqualTo("INSUFFICIENT_STOCK");
    }

    @Test
    void validationRulesPerTransactionType() throws Exception {
        assertThat(reject(Tx.of("TRANSFER", "2026-01-01", bank).amount("100"), 400)).isEqualTo("DESTINATION_REQUIRED");
        assertThat(reject(Tx.of("TRANSFER", "2026-01-01", bank).set("destinationAccountId", bank).amount("100"), 400)).isEqualTo("SAME_ACCOUNT");
        assertThat(reject(Tx.of("INCOME", "2026-01-01", bank).amount("100"), 400)).isEqualTo("CATEGORY_REQUIRED");
        assertThat(reject(Tx.of("INCOME", "2026-01-01", bank).set("categoryId", foodCat).amount("100"), 400)).isEqualTo("CATEGORY_TYPE_MISMATCH");
        assertThat(reject(Tx.of("EXPENSE", "2026-01-01", bank).set("categoryId", salaryCat).amount("100"), 400)).isEqualTo("CATEGORY_TYPE_MISMATCH");
        assertThat(reject(Tx.of("EXPENSE", "2026-01-01", bank).set("categoryId", 999_999).amount("100"), 404)).isEqualTo("NOT_FOUND");
        assertThat(reject(Tx.of("BUY_INVESTMENT", "2026-01-01", rdn).qty("1", "SHARE", "1"), 400)).isEqualTo("ASSET_REQUIRED");
        assertThat(reject(Tx.of("BUY_INVESTMENT", "2026-01-01", rdn).set("assetId", 999_999).qty("1", "SHARE", "1"), 404)).isEqualTo("NOT_FOUND");
        assertThat(reject(Tx.of("BUY_INVESTMENT", "2026-01-01", rdn).set("assetId", bbca).amount("100"), 400)).isEqualTo("QUANTITY_REQUIRED");
        assertThat(reject(Tx.of("BUY_INVESTMENT", "2026-01-01", rdn).set("assetId", bbca).set("quantity", 1), 400)).isEqualTo("QUANTITY_REQUIRED");
        assertThat(reject(Tx.of("BUY_INVESTMENT", "2026-01-01", rdn).set("assetId", bbca).set("quantity", 1).set("quantityUnit", "SHARE"), 400)).isEqualTo("QUANTITY_REQUIRED");
        assertThat(reject(Tx.of("LOAN", "2026-01-01", bank).amount("100"), 400)).isEqualTo("LIABILITY_REQUIRED");
        assertThat(reject(Tx.of("LOAN", "2026-01-01", bank).set("liabilityId", 999_999).amount("100"), 404)).isEqualTo("NOT_FOUND");
        assertThat(reject(Tx.of("INCOME", "2026-01-01", bank).set("categoryId", salaryCat), 400)).isEqualTo("AMOUNT_REQUIRED");
        assertThat(reject(Tx.of("INCOME", "2026-01-01", bank).set("categoryId", salaryCat).set("unitPrice", 5), 400)).isEqualTo("AMOUNT_REQUIRED");
        assertThat(reject(Tx.of("INCOME", "2026-01-01", 999_999).set("categoryId", salaryCat).amount("1"), 404)).isEqualTo("NOT_FOUND");
        assertThat(reject(Tx.of("TRANSFER", "2026-01-01", bank).set("destinationAccountId", 999_999).amount("100"), 404)).isEqualTo("NOT_FOUND");
        assertThat(reject(Tx.of("INCOME", "2026-01-01", bank).set("categoryId", salaryCat).amount("-5"), 400)).isEqualTo("VALIDATION_ERROR");
        assertThat(reject(Tx.of("SELL_INVESTMENT", "2026-01-01", rdn).set("assetId", bbca).qty("5", "SHARE", "1"), 400)).isEqualTo("INSUFFICIENT_STOCK");
        assertThat(errorCode(get("/api/transactions/999999"), token, null, 404)).isEqualTo("NOT_FOUND");

        // Another user cannot see or use my data
        String other = registerAndLogin("other-" + System.nanoTime() + "@test.id");
        assertThat(errorCode(get("/api/accounts/" + bank), other, null, 404)).isEqualTo("NOT_FOUND");
        assertThat(errorCode(post("/api/transactions"), other, Tx.of("OPENING_BALANCE", "2026-01-01", bank).amount("1").build(), 404)).isEqualTo("NOT_FOUND");

        // Shortcut endpoints enforce their type
        assertThat(errorCode(post("/api/stocks/buy"), token, Tx.of("INCOME", "2026-01-01", rdn).build(), 400)).isEqualTo("TYPE_MISMATCH");
        submit(Tx.of("OPENING_BALANCE", "2026-01-01", rdn).amount("50000000"));
        data(post("/api/stocks/buy"), token, Tx.of("BUY_INVESTMENT", "2026-01-02", rdn).set("assetId", bbca).qty("100", "SHARE", "10000").build(), 201);
        data(post("/api/stocks/sell"), token, Tx.of("SELL_INVESTMENT", "2026-01-03", rdn).set("assetId", bbca).qty("10", "SHARE", "11000").build(), 201);
        data(post("/api/dividends"), token, Tx.of("DIVIDEND", "2026-01-04", rdn).set("assetId", bbca).set("quantity", 100).set("quantityUnit", "SHARE").amount("9000").build(), 201);
    }

    @Test
    void accountsAssetsAndLiabilitiesCrud() throws Exception {
        JsonNode acc = data(put("/api/accounts/" + bank), token, Map.of("name", "BCA Prioritas", "category", "BANK", "currency", "idr", "institution", "BCA"), 200);
        assertThat(acc.path("name").asText()).isEqualTo("BCA Prioritas");
        assertThat(acc.path("currency").asText()).isEqualTo("IDR");
        assertThat(data(get("/api/accounts"), token, null, 200)).hasSize(3);
        assertThat(errorCode(post("/api/assets"), token, Map.of("code", "bbca", "name", "dup", "assetType", "STOCK", "currency", "IDR", "quantityUnit", "SHARE"), 400)).isEqualTo("DUPLICATE_CODE");
        long noPrice = data(post("/api/assets"), token, Map.of("code", "NOPRICE", "name", "x", "assetType", "OTHER", "currency", "IDR", "quantityUnit", "UNIT"), 201).path("id").asLong();
        JsonNode priced = data(put("/api/assets/" + noPrice + "/price"), token, Map.of("currentPrice", 5, "valuationDate", "2026-06-01"), 200);
        assertThat(dec(priced.path("currentPrice"))).isEqualByComparingTo("5");
        assertThat(data(get("/api/assets/" + noPrice), token, null, 200).path("valuationDate").asText()).isEqualTo("2026-06-01");
        assertThat(errorCode(get("/api/assets/999999"), token, null, 404)).isEqualTo("NOT_FOUND");
        JsonNode chart = data(get("/api/chart-of-accounts"), token, null, 200);
        assertThat(chart.size()).isGreaterThan(30);
        JsonNode liabs = data(get("/api/liabilities"), token, null, 200);
        assertThat(liabs.get(0).path("status").asText()).isEqualTo("PAID_OFF");
    }
}
