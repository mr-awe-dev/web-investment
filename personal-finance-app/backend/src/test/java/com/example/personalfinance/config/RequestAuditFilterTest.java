package com.example.personalfinance.config;

import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.security.UserPrincipal;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;

class RequestAuditFilterTest {

    private final RequestAuditFilter filter = new RequestAuditFilter();

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
        MDC.clear();
    }

    @Test
    void generatesRequestIdWhenHeaderMissing() throws Exception {
        MockHttpServletResponse res = perform("GET", "/api/accounts", null, 200);
        assertThat(res.getHeader(RequestAuditFilter.REQUEST_ID_HEADER)).isNotBlank();
        assertThat(MDC.get("requestId")).isNull();
    }

    @Test
    void generatesRequestIdWhenHeaderBlank() throws Exception {
        MockHttpServletResponse res = perform("GET", "/api/accounts", "   ", 200);
        assertThat(res.getHeader(RequestAuditFilter.REQUEST_ID_HEADER)).isNotBlank();
    }

    @Test
    void keepsProvidedRequestIdAndLogsClientError() throws Exception {
        MockHttpServletResponse res = perform("GET", "/api/missing", "req-123", 404);
        assertThat(res.getHeader(RequestAuditFilter.REQUEST_ID_HEADER)).isEqualTo("req-123");
    }

    @Test
    void logsServerErrorForAuthenticatedUser() throws Exception {
        User user = new User();
        user.setId(42L);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(new UserPrincipal(user), null));
        MockHttpServletResponse res = perform("GET", "/api/accounts", null, 500);
        assertThat(res.getHeader(RequestAuditFilter.REQUEST_ID_HEADER)).isNotBlank();
    }

    @Test
    void ignoresPrincipalsThatAreNotUserPrincipal() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("someone", null));
        MockHttpServletResponse res = perform("GET", "/api/accounts", null, 200);
        assertThat(res.getHeader(RequestAuditFilter.REQUEST_ID_HEADER)).isNotBlank();
    }

    private MockHttpServletResponse perform(String method, String path, String requestId, int status) throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest(method, path);
        if (requestId != null) {
            req.addHeader(RequestAuditFilter.REQUEST_ID_HEADER, requestId);
        }
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(req, res, (request, response) -> ((HttpServletResponse) response).setStatus(status));
        return res;
    }
}
