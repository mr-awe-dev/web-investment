package com.example.personalfinance.dto.response;

import java.util.List;

/** Page envelope decoupled from Spring's Page implementation. */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {}
