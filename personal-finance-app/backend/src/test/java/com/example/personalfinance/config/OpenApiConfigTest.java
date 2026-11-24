package com.example.personalfinance.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OpenApiConfigTest {

    private final OpenAPI api = new OpenApiConfig().personalFinanceOpenAPI();

    @Test
    void documentsApiWithBearerJwtSecurity() {
        assertThat(api.getInfo().getTitle()).isEqualTo("Personal Finance API");
        assertThat(api.getInfo().getVersion()).isEqualTo("1.0.0");
        assertThat(api.getSecurity()).hasSize(1);
        assertThat(api.getSecurity().get(0).get(OpenApiConfig.BEARER_SCHEME)).isNotNull();

        SecurityScheme scheme = api.getComponents().getSecuritySchemes().get(OpenApiConfig.BEARER_SCHEME);
        assertThat(scheme.getType()).isEqualTo(SecurityScheme.Type.HTTP);
        assertThat(scheme.getScheme()).isEqualTo("bearer");
        assertThat(scheme.getBearerFormat()).isEqualTo("JWT");
    }
}
