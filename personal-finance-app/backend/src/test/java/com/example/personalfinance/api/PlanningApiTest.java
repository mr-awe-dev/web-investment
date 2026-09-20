package com.example.personalfinance.api;

import com.example.personalfinance.support.ApiTestBase;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/** Bonds & coupon schedules, budgets, reconciliation and dashboard upcoming items. */
class PlanningApiTest extends ApiTestBase {

    @Test
    void bondsAndCouponSchedule() throws Exception {
        String token = registerAndLogin("bond-" + System.nanoTime() + "@test.id");
        long bond = createAsset(token, "FR0100", "BOND", "UNIT", "1000000");
        long stock = createAsset(token, "ASII", "STOCK", "SHARE", "5000");
        Map<String, Object> req = new HashMap<>(Map.of("assetId", bond, "issuer", "RI", "nominalValue", 10_000_000, "couponRate", 6, "frequency", "QUARTERLY",
                "settlementDate", "2025-01-15", "maturityDate", "2027-01-15"));
        assertThat(errorCode(post("/api/bonds"), token, withKey(req, "assetId", stock), 400)).isEqualTo("ASSET_NOT_BOND");
        assertThat(errorCode(post("/api/bonds"), token, withKey(req, "maturityDate", "2024-01-15"), 400)).isEqualTo("INVALID_MATURITY");
        JsonNode created = data(post("/api/bonds"), token, req, 201);
        assertThat(created.path("schedule")).hasSize(8);
        assertThat(dec(created.path("schedule").get(0).path("gross"))).isEqualByComparingTo("150000.00");
        assertThat(dec(created.path("taxRate"))).isZero();
        data(post("/api/bonds"), token, Map.of("assetId", createAsset(token, "FR0101", "BOND", "UNIT", "1"), "nominalValue", 1_000_000, "couponRate", 12,
                "taxRate", 10, "frequency", "MONTHLY", "settlementDate", LocalDate.now().minusMonths(2).toString(), "maturityDate", LocalDate.now().plusMonths(2).toString()), 201);
        JsonNode coupons = data(get("/api/bonds/coupons"), token, null, 200);
        assertThat(coupons.size()).isEqualTo(12);
        assertThat(coupons.toString()).contains("\"PAID\"").contains("\"UPCOMING\"");
        assertThat(data(get("/api/bonds"), token, null, 200)).hasSize(2);
        JsonNode dash = data(get("/api/dashboard"), token, null, 200);
        assertThat(dash.path("upcoming").toString()).contains("COUPON");
    }

    @Test
    void budgetsTrackActualSpendFromLedger() throws Exception {
        String token = registerAndLogin("budget-" + System.nanoTime() + "@test.id");
        long cash = createAccount(token, "Kas", "CASH");
        long food = categoryId(token, "5100"), housing = categoryId(token, "5200"), transport = categoryId(token, "5600"), salary = categoryId(token, "4100");
        data(post("/api/transactions"), token, Tx.of("OPENING_BALANCE", "2026-05-01", cash).amount("10000000").build(), 201);
        data(post("/api/transactions"), token, Tx.of("EXPENSE", "2026-05-10", cash).set("categoryId", food).amount("900000").build(), 201);
        data(post("/api/transactions"), token, Tx.of("EXPENSE", "2026-05-11", cash).set("categoryId", housing).amount("2500000").build(), 201);

        assertThat(errorCode(post("/api/budgets"), token, Map.of("categoryId", salary, "periodMonth", "2026-05", "amount", 1), 400)).isEqualTo("CATEGORY_NOT_EXPENSE");
        JsonNode b1 = data(post("/api/budgets"), token, Map.of("categoryId", food, "periodMonth", "2026-05", "amount", 1_000_000), 201);
        assertThat(b1.path("status").asText()).isEqualTo("NEAR_LIMIT");
        assertThat(dec(b1.path("remaining"))).isEqualByComparingTo("100000.00");
        JsonNode b1b = data(post("/api/budgets"), token, Map.of("categoryId", food, "periodMonth", "2026-05", "amount", 5_000_000), 201);
        assertThat(b1b.path("id").asLong()).isEqualTo(b1.path("id").asLong());
        assertThat(b1b.path("status").asText()).isEqualTo("HEALTHY");
        assertThat(data(post("/api/budgets"), token, Map.of("categoryId", housing, "periodMonth", "2026-05", "amount", 2_000_000), 201).path("status").asText()).isEqualTo("OVER_BUDGET");
        data(post("/api/budgets"), token, Map.of("categoryId", transport, "periodMonth", "2026-05", "amount", 500_000), 201);
        assertThat(data(get("/api/budgets?period=2026-05"), token, null, 200)).hasSize(3);
        call(delete("/api/budgets/" + b1.path("id").asLong()), token, null, 200);
        assertThat(errorCode(delete("/api/budgets/" + b1.path("id").asLong()), token, null, 404)).isEqualTo("NOT_FOUND");
        assertThat(data(get("/api/budgets?period=2026-05"), token, null, 200)).hasSize(2);
    }

    @Test
    void reconciliationComparesLedgerWithStatement() throws Exception {
        String token = registerAndLogin("recon-" + System.nanoTime() + "@test.id");
        long bank = createAccount(token, "Bank", "BANK");
        data(post("/api/transactions"), token, Tx.of("OPENING_BALANCE", "2026-05-01", bank).amount("1000000").build(), 201);
        JsonNode ok = data(post("/api/reconciliations"), token, Map.of("accountId", bank, "reconciliationDate", "2026-05-31", "actualBalance", 1_000_000), 201);
        assertThat(ok.path("status").asText()).isEqualTo("RECONCILED");
        JsonNode diff = data(post("/api/reconciliations"), token, Map.of("accountId", bank, "reconciliationDate", "2026-05-31", "actualBalance", 990_000), 201);
        assertThat(diff.path("status").asText()).isEqualTo("DIFFERENCE_FOUND");
        assertThat(dec(diff.path("difference"))).isEqualByComparingTo("-10000.00");
        JsonNode pending = data(post("/api/reconciliations"), token, Map.of("accountId", bank, "reconciliationDate", "2026-05-31", "actualBalance", 1_010_000, "notes", "Bunga belum dicatat"), 201);
        assertThat(pending.path("status").asText()).isEqualTo("PENDING_REVIEW");
        assertThat(data(get("/api/reconciliations"), token, null, 200)).hasSize(3);
    }

    @Test
    void dashboardUpcomingDebtPaymentsRespectDueDateInstallmentAndBalance() throws Exception {
        String token = registerAndLogin("dash-" + System.nanoTime() + "@test.id");
        long bank = createAccount(token, "Bank", "BANK");
        String future = LocalDate.now().plusDays(5).toString(), past = LocalDate.now().minusDays(5).toString();
        long due = liability(token, "Due", future, 100_000);
        liability(token, "NoDue", null, 100_000);
        liability(token, "NoInstallment", future, null);
        liability(token, "Past", past, 100_000);
        long paid = liability(token, "PaidOff", future, 100_000);
        data(post("/api/transactions"), token, Tx.of("LOAN", "2026-01-01", bank).set("liabilityId", due).amount("5000000").build(), 201);
        data(post("/api/transactions"), token, Tx.of("LOAN", "2026-01-01", bank).set("liabilityId", paid).amount("5000000").build(), 201);
        data(post("/api/transactions"), token, Tx.of("DEBT_PAYMENT", "2026-01-02", bank).set("liabilityId", paid).amount("5000000").build(), 201);
        JsonNode dash = data(get("/api/dashboard"), token, null, 200);
        assertThat(dash.path("upcoming")).hasSize(1);
        assertThat(dash.path("upcoming").get(0).path("label").asText()).isEqualTo("Due");
        assertThat(dash.path("allocation")).isEmpty();
        assertThat(dec(dash.path("cashAndBank"))).isEqualByComparingTo("5000000.00");
    }

    private long liability(String token, String name, String dueDate, Integer installment) throws Exception {
        Map<String, Object> m = new HashMap<>(Map.of("name", name, "liabilityType", "LOAN", "currency", "IDR"));
        if (dueDate != null) m.put("dueDate", dueDate);
        if (installment != null) m.put("installment", installment);
        return data(post("/api/liabilities"), token, m, 201).path("id").asLong();
    }

    private static Map<String, Object> withKey(Map<String, Object> base, String key, Object value) {
        Map<String, Object> m = new HashMap<>(base);
        m.put(key, value);
        return m;
    }
}
