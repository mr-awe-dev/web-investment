package com.example.personalfinance.api;

import com.example.personalfinance.config.DemoDataSeeder;
import com.example.personalfinance.security.CustomUserDetailsService;
import com.example.personalfinance.security.JwtService;
import com.example.personalfinance.support.ApiTestBase;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

class AuthApiTest extends ApiTestBase {

    @Autowired JwtService jwt;
    @Autowired CustomUserDetailsService userDetails;
    @Autowired DemoDataSeeder seeder;
    @Autowired com.example.personalfinance.service.ChartOfAccountService coa;
    @Autowired com.example.personalfinance.repository.UserRepository users;

    @Test
    void registerLoginMeAndSettings() throws Exception {
        String token = registerAndLogin("auth1@test.id");
        JsonNode me = data(get("/api/auth/me"), token, null, 200);
        assertThat(me.path("email").asText()).isEqualTo("auth1@test.id");
        assertThat(me.path("baseCurrency").asText()).isEqualTo("IDR");

        assertThat(errorCode(post("/api/auth/register"), null, Map.of("email", "auth1@test.id", "password", "Password123", "fullName", "Dup"), 409)).isEqualTo("EMAIL_EXISTS");
        assertThat(errorCode(post("/api/auth/register"), null, Map.of("email", "bad", "password", "short", "fullName", ""), 400)).isEqualTo("VALIDATION_ERROR");

        JsonNode login = data(post("/api/auth/login"), null, Map.of("email", "AUTH1@test.id", "password", "Password123"), 200);
        assertThat(login.path("token").asText()).isNotBlank();
        assertThat(errorCode(post("/api/auth/login"), null, Map.of("email", "auth1@test.id", "password", "wrong"), 401)).isEqualTo("INVALID_CREDENTIALS");
        assertThat(errorCode(post("/api/auth/login"), null, Map.of("email", "nobody@test.id", "password", "wrong"), 401)).isEqualTo("INVALID_CREDENTIALS");

        JsonNode settings = data(put("/api/auth/settings"), token, Map.of("baseCurrency", "usd", "costBasisMethod", "AVERAGE", "fullName", "Renamed"), 200);
        assertThat(settings.path("baseCurrency").asText()).isEqualTo("USD");
        assertThat(settings.path("costBasisMethod").asText()).isEqualTo("AVERAGE");
    }

    @Test
    void protectedEndpointsRejectMissingOrInvalidTokens() throws Exception {
        call(get("/api/accounts"), null, null, 401);
        call(get("/api/accounts"), "not-a-jwt", null, 401);
        call(get("/api/accounts"), jwt.generate(999_999L), null, 401);
        mvc.perform(get("/api/accounts").header("Authorization", "Basic abc")).andExpect(r -> assertThat(r.getResponse().getStatus()).isEqualTo(401));
    }

    @Test
    void userDetailsServiceAndPrincipal() {
        assertThatThrownBy(() -> coa.byCode(users.findByEmailIgnoreCase(DemoDataSeeder.EMAIL).orElseThrow(), "9999"))
                .isInstanceOf(com.example.personalfinance.exception.NotFoundException.class);
        assertThatThrownBy(() -> userDetails.loadUserByUsername("ghost@test.id")).isInstanceOf(UsernameNotFoundException.class);
        assertThatThrownBy(() -> userDetails.loadById(999_999L)).isInstanceOf(UsernameNotFoundException.class);
        var principal = userDetails.loadUserByUsername(DemoDataSeeder.EMAIL);
        assertThat(principal.getUsername()).isEqualTo(DemoDataSeeder.EMAIL);
        assertThat(principal.getPassword()).startsWith("$2");
        assertThat(principal.getAuthorities()).hasSize(1);
    }

    @Test
    void demoSeederIsIdempotentAndDemoUserCanLogin() throws Exception {
        seeder.run(null);
        JsonNode login = data(post("/api/auth/login"), null, Map.of("email", DemoDataSeeder.EMAIL, "password", DemoDataSeeder.PASSWORD), 200);
        JsonNode dashboard = data(get("/api/dashboard"), login.path("token").asText(), null, 200);
        assertThat(dec(dashboard.path("netWorth"))).isPositive();
        assertThat(dashboard.path("recentTransactions")).hasSize(8);
        assertThat(dashboard.path("upcoming").size()).isGreaterThan(1);
        assertThat(dashboard.path("netWorthHistory").size()).isGreaterThanOrEqualTo(5);
        assertThat(dec(dashboard.path("investment").path("realizedPl"))).isNotZero();
    }
}
