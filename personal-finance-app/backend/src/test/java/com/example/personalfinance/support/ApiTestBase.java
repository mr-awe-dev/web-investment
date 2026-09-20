package com.example.personalfinance.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/** Shared MockMvc plumbing: every test registers its own user so ledgers never interfere. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class ApiTestBase {

    @Autowired protected MockMvc mvc;
    @Autowired protected ObjectMapper json;

    protected String registerAndLogin(String email) throws Exception {
        JsonNode res = call(post("/api/auth/register"), null, Map.of("email", email, "password", "Password123", "fullName", "Tester"), 201);
        return res.path("data").path("token").asText();
    }

    /** Executes a request with optional bearer token and body, asserting the status and returning the parsed JSON (or null). */
    protected JsonNode call(MockHttpServletRequestBuilder req, String token, Object body, int expectedStatus) throws Exception {
        if (token != null) req.header("Authorization", "Bearer " + token);
        if (body != null) req.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body));
        MvcResult r = mvc.perform(req).andReturn();
        assertThat(r.getResponse().getStatus()).as(r.getResponse().getContentAsString()).isEqualTo(expectedStatus);
        String content = r.getResponse().getContentAsString();
        return content.isEmpty() || !r.getResponse().getContentType().contains("json") ? null : json.readTree(content);
    }

    protected JsonNode data(MockHttpServletRequestBuilder req, String token, Object body, int status) throws Exception {
        return call(req, token, body, status).path("data");
    }

    protected String errorCode(MockHttpServletRequestBuilder req, String token, Object body, int status) throws Exception {
        return call(req, token, body, status).path("code").asText();
    }

    protected long createAccount(String token, String name, String category) throws Exception {
        return data(post("/api/accounts"), token, Map.of("name", name, "category", category, "currency", "IDR"), 201).path("id").asLong();
    }

    protected long createAsset(String token, String code, String type, String unit, String price) throws Exception {
        return data(post("/api/assets"), token, Map.of("code", code, "name", code + " name", "assetType", type, "currency", "IDR",
                "quantityUnit", unit, "currentPrice", new BigDecimal(price)), 201).path("id").asLong();
    }

    protected long categoryId(String token, String code) throws Exception {
        for (JsonNode c : data(get("/api/chart-of-accounts"), token, null, 200)) if (c.path("code").asText().equals(code)) return c.path("id").asLong();
        throw new IllegalStateException(code);
    }

    protected BigDecimal dec(JsonNode n) { return new BigDecimal(n.asText()); }

    /** Minimal fluent transaction payload builder. */
    public static class Tx {
        private final Map<String, Object> m = new LinkedHashMap<>();

        public static Tx of(String type, String date, long accountId) {
            Tx t = new Tx();
            t.m.put("type", type); t.m.put("transactionDate", date); t.m.put("accountId", accountId);
            return t;
        }

        public Tx set(String k, Object v) { m.put(k, v); return this; }
        public Tx amount(String v) { return set("grossAmount", new BigDecimal(v)); }
        public Tx qty(String q, String unit, String price) { return set("quantity", new BigDecimal(q)).set("quantityUnit", unit).set("unitPrice", new BigDecimal(price)); }
        public Map<String, Object> build() { return m; }
    }
}
