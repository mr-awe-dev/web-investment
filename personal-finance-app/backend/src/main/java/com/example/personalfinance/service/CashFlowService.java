package com.example.personalfinance.service;

import com.example.personalfinance.domain.cashflow.CashFlowCategory;
import com.example.personalfinance.domain.common.Money;
import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.dto.response.CashFlowResponse;
import com.example.personalfinance.repository.JournalEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Cash-flow statement derived from journal entries on cash accounts, classified by transaction type. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CashFlowService {

    private final JournalEntryRepository entries;

    public CashFlowResponse statement(User user, LocalDate from, LocalDate to) {
        List<CashFlowResponse.Line> lines = entries.cashFlows(user.getId(), from, to).stream()
                .map(r -> new CashFlowResponse.Line(r.type().cashFlowCategory(), r.type(), Money.of(r.amount())))
                .sorted((a, b) -> a.type().compareTo(b.type())).toList();
        BigDecimal operating = sum(lines, CashFlowCategory.OPERATING);
        BigDecimal investing = sum(lines, CashFlowCategory.INVESTING);
        BigDecimal financing = sum(lines, CashFlowCategory.FINANCING);
        return new CashFlowResponse(from, to, operating, investing, financing, operating.add(investing).add(financing), lines);
    }

    private static BigDecimal sum(List<CashFlowResponse.Line> lines, CashFlowCategory c) {
        return lines.stream().filter(l -> l.category() == c).map(CashFlowResponse.Line::amount).reduce(Money.ZERO, BigDecimal::add);
    }
}
