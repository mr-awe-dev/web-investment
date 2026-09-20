package com.example.personalfinance.api;

import com.example.personalfinance.domain.accounting.Journal;
import com.example.personalfinance.repository.JournalRepository;
import com.example.personalfinance.support.ApiTestBase;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.SpyBean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/** If any step of the accounting pipeline fails the whole transaction must roll back. */
class AtomicityTest extends ApiTestBase {

    @SpyBean JournalRepository journals;

    @Test
    void failureWhilePostingJournalRollsBackTransactionAndLot() throws Exception {
        String token = registerAndLogin("atomic-" + System.nanoTime() + "@test.id");
        long rdn = createAccount(token, "RDN", "RDN");
        long asset = createAsset(token, "BBRI", "STOCK", "SHARE", "5000");
        data(post("/api/transactions"), token, Tx.of("OPENING_BALANCE", "2026-01-01", rdn).amount("10000000").build(), 201);

        Mockito.doThrow(new IllegalStateException("simulated failure")).when(journals).save(any(Journal.class));
        assertThat(errorCode(post("/api/transactions"), token,
                Tx.of("BUY_INVESTMENT", "2026-01-02", rdn).set("assetId", asset).qty("100", "SHARE", "5000").build(), 500)).isEqualTo("INTERNAL_ERROR");
        Mockito.reset(journals);

        JsonNode list = data(get("/api/transactions"), token, null, 200);
        assertThat(list.path("totalElements").asLong()).isEqualTo(1);
        assertThat(data(get("/api/portfolio/lots"), token, null, 200)).isEmpty();
        assertThat(dec(data(get("/api/accounts/" + rdn), token, null, 200).path("balance"))).isEqualByComparingTo("10000000.00");
    }
}
