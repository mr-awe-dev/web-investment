package com.example.personalfinance.domain;

import com.example.personalfinance.domain.accounting.ChartOfAccount;
import com.example.personalfinance.domain.accounting.Journal;
import com.example.personalfinance.domain.accounting.JournalEntry;
import com.example.personalfinance.domain.accounting.LedgerType;
import com.example.personalfinance.domain.bond.Bond;
import com.example.personalfinance.domain.bond.CouponFrequency;
import com.example.personalfinance.domain.common.Money;
import com.example.personalfinance.domain.transaction.TransactionType;
import com.example.personalfinance.dto.response.ApiResponse;
import com.example.personalfinance.exception.GlobalExceptionHandler;
import com.example.personalfinance.exception.UnbalancedJournalException;
import com.example.personalfinance.service.PortfolioService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Pure domain rules that do not need a Spring context. */
class DomainRulesTest {

    @Test
    void journalMustBalance() {
        ChartOfAccount a = new ChartOfAccount();
        Journal j = new Journal();
        j.addEntry(JournalEntry.debit(a, BigDecimal.TEN, null));
        j.addEntry(JournalEntry.credit(a, BigDecimal.ONE, null));
        assertThatThrownBy(j::validateBalanced).isInstanceOf(UnbalancedJournalException.class);
        j.addEntry(JournalEntry.credit(a, new BigDecimal("9"), null));
        j.validateBalanced();
    }

    @Test
    void ledgerTypesAndMoney() {
        assertThat(LedgerType.ASSET.debitNormal()).isTrue();
        assertThat(LedgerType.EXPENSE.debitNormal()).isTrue();
        assertThat(LedgerType.INCOME.debitNormal()).isFalse();
        assertThat(Money.of(null)).isEqualByComparingTo("0");
        assertThat(Money.of(new BigDecimal("1.005"))).isEqualByComparingTo("1.01");
        assertThat(PortfolioService.percent(BigDecimal.ONE, BigDecimal.ZERO)).isZero();
    }

    @Test
    void netAmountPerType() {
        BigDecimal g = new BigDecimal("100"), f = new BigDecimal("5"), t = new BigDecimal("2"), i = new BigDecimal("10");
        assertThat(TransactionType.BUY_INVESTMENT.netAmount(g, f, t, i)).isEqualByComparingTo("107");
        assertThat(TransactionType.DEBT_PAYMENT.netAmount(g, f, t, i)).isEqualByComparingTo("115");
        assertThat(TransactionType.SELL_INVESTMENT.netAmount(g, f, t, i)).isEqualByComparingTo("93");
        assertThat(TransactionType.TRANSFER.netAmount(g, f, t, i)).isEqualByComparingTo("100");
        assertThat(TransactionType.DIVIDEND.requiresAsset()).isTrue();
        assertThat(TransactionType.COUPON.requiresAsset()).isTrue();
        assertThat(TransactionType.INCOME.requiresAsset()).isFalse();
        assertThat(TransactionType.ASSET_SALE.isDisposal()).isTrue();
        assertThat(TransactionType.TAX.cashFlowCategory().name()).isEqualTo("OPERATING");
    }

    @Test
    void bondScheduleAndFrequencies() {
        Bond b = new Bond();
        b.setNominalValue(new BigDecimal("12000000"));
        b.setCouponRate(new BigDecimal("6"));
        b.setTaxRate(new BigDecimal("10"));
        b.setFrequency(CouponFrequency.SEMI_ANNUAL);
        b.setSettlementDate(LocalDate.of(2026, 1, 1));
        b.setMaturityDate(LocalDate.of(2027, 1, 1));
        var items = b.schedule(LocalDate.of(2026, 9, 1));
        assertThat(items).hasSize(2);
        assertThat(items.get(0).gross()).isEqualByComparingTo("360000.00");
        assertThat(items.get(0).net()).isEqualByComparingTo("324000.00");
        assertThat(items.get(0).status()).isEqualTo("PAID");
        assertThat(items.get(1).status()).isEqualTo("UPCOMING");
        assertThat(CouponFrequency.ANNUAL.months()).isEqualTo(12);
        assertThat(CouponFrequency.MONTHLY.perYear()).isEqualTo(12);
    }

    @RestController
    static class BoomController {
        @GetMapping("/boom")
        public String boom() { throw new IllegalStateException("secret internals"); }
    }

    @Test
    void balanceSheetFlagsAnInconsistentLedger() {
        ChartOfAccount asset = ChartOfAccount.of(null, "1100", "Kas", LedgerType.ASSET, "1000", true, true);
        asset.setId(1L);
        var ledger = org.mockito.Mockito.mock(com.example.personalfinance.service.LedgerService.class);
        org.mockito.Mockito.when(ledger.snapshot(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(new com.example.personalfinance.service.LedgerService.LedgerSnapshot(java.util.List.of(asset), java.util.Map.of(1L, BigDecimal.TEN)));
        var bs = new com.example.personalfinance.service.BalanceSheetService(ledger).asOf(new com.example.personalfinance.domain.user.User(), LocalDate.now());
        assertThat(bs.balanced()).isFalse();
        assertThat(bs.equity()).isEqualByComparingTo("10");
    }

    @Test
    void unexpectedExceptionsAreMaskedAsInternalError() throws Exception {
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new BoomController()).setControllerAdvice(new GlobalExceptionHandler()).build();
        mvc.perform(get("/boom")).andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.message").value("Terjadi kesalahan internal"));
        ApiResponse<String> ok = ApiResponse.ok("x");
        assertThat(ok.success()).isTrue();
        assertThat(ok.timestamp()).isNotNull();
    }
}
