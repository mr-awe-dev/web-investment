package com.example.personalfinance.config;

import com.example.personalfinance.security.UserPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/** Correlates every request with an id, exposes it in MDC/headers, and writes one access log line. */
@Slf4j
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class RequestAuditFilter extends OncePerRequestFilter {

    public static final String REQUEST_ID_HEADER = "X-Request-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String requestId = requestId(req.getHeader(REQUEST_ID_HEADER));
        String userId = currentUserId();
        long started = System.nanoTime();
        MDC.put("requestId", requestId);
        MDC.put("method", req.getMethod());
        MDC.put("path", req.getRequestURI());
        if (userId != null) {
            MDC.put("userId", userId);
        }
        res.setHeader(REQUEST_ID_HEADER, requestId);
        try {
            chain.doFilter(req, res);
        } finally {
            int status = res.getStatus();
            MDC.put("status", String.valueOf(status));
            MDC.put("durationMs", String.valueOf((System.nanoTime() - started) / 1_000_000));
            if (status >= 500) {
                log.error("request completed with server error");
            } else if (status >= 400) {
                log.warn("request completed with client error");
            } else {
                log.info("request completed");
            }
            MDC.clear();
        }
    }

    private String requestId(String header) {
        return header == null || header.isBlank() ? UUID.randomUUID().toString() : header;
    }

    private String currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return String.valueOf(principal.user().getId());
        }
        return null;
    }
}
