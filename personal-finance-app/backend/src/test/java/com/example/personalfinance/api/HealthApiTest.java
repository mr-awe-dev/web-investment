package com.example.personalfinance.api;

import com.example.personalfinance.config.RequestAuditFilter;
import com.example.personalfinance.support.ApiTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

class HealthApiTest extends ApiTestBase {

    @Test
    void healthIsPublicAndCarriesRequestId() throws Exception {
        MvcResult r = mvc.perform(get("/api/health")).andReturn();
        assertThat(r.getResponse().getStatus()).isEqualTo(200);
        assertThat(r.getResponse().getHeader(RequestAuditFilter.REQUEST_ID_HEADER)).isNotBlank();
        assertThat(json.readTree(r.getResponse().getContentAsString()).path("data").path("status").asText()).isEqualTo("UP");
    }

    @Test
    void healthEchoesProvidedRequestId() throws Exception {
        MvcResult r = mvc.perform(get("/api/health").header(RequestAuditFilter.REQUEST_ID_HEADER, "trace-abc")).andReturn();
        assertThat(r.getResponse().getHeader(RequestAuditFilter.REQUEST_ID_HEADER)).isEqualTo("trace-abc");
    }
}
