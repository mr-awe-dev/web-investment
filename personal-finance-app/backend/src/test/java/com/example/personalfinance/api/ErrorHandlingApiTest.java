package com.example.personalfinance.api;

import com.example.personalfinance.support.ApiTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * Client-input errors must surface as 4xx, not as the catch-all 500.
 * Every handler here used to be swallowed by the generic Exception handler.
 */
class ErrorHandlingApiTest extends ApiTestBase {

    @Test
    void missingRequiredQueryParameterIs400() throws Exception {
        String token = registerAndLogin("missingparam-" + System.nanoTime() + "@test.id");
        assertThat(errorCode(get("/api/budgets"), token, null, 400)).isEqualTo("MISSING_PARAMETER");
    }

    @Test
    void unparseableQueryParameterIs400() throws Exception {
        String token = registerAndLogin("badtype-" + System.nanoTime() + "@test.id");
        assertThat(errorCode(get("/api/transactions").param("page", "bukan-angka"), token, null, 400))
                .isEqualTo("INVALID_PARAMETER");
        assertThat(errorCode(get("/api/transactions").param("type", "BUKAN_ENUM"), token, null, 400))
                .isEqualTo("INVALID_PARAMETER");
    }

    @Test
    void malformedJsonBodyIs400() throws Exception {
        // The shared helper serialises with ObjectMapper, so the raw content has to go in directly.
        MvcResult r = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ini bukan json"))
                .andReturn();
        assertThat(r.getResponse().getStatus()).isEqualTo(400);
        assertThat(json.readTree(r.getResponse().getContentAsString()).path("code").asText())
                .isEqualTo("MALFORMED_BODY");
    }

    @Test
    void unsupportedHttpMethodIs405() throws Exception {
        String token = registerAndLogin("method-" + System.nanoTime() + "@test.id");
        assertThat(errorCode(delete("/api/dashboard"), token, null, 405)).isEqualTo("METHOD_NOT_ALLOWED");
    }

    @Test
    void unknownPathIs404() throws Exception {
        // Only reachable on paths that pass the security rules. Under /api/** the filter chain
        // answers 401 before routing, so probe the permitAll docs area instead.
        assertThat(errorCode(get("/swagger-ui/tidak-ada.js"), null, null, 404)).isEqualTo("NOT_FOUND");
    }
}