package com.example.personalfinance.service;

import com.example.personalfinance.domain.accounting.ChartOfAccountsTemplate;
import com.example.personalfinance.domain.accounting.LedgerType;
import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.dto.response.BalanceSheetResponse;
import com.example.personalfinance.dto.response.LineItem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Balance sheet at book value from the ledger. Enforces Assets − Liabilities = Equity. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BalanceSheetService {

    private final LedgerService ledger;

    public BalanceSheetResponse asOf(User user, LocalDate asOf) {
        LedgerService.LedgerSnapshot snap = ledger.snapshot(user, LedgerService.MIN, asOf);
        BigDecimal assets = snap.total(LedgerType.ASSET);
        BigDecimal liabilities = snap.total(LedgerType.LIABILITY);
        BigDecimal currentResult = snap.total(LedgerType.INCOME).subtract(snap.total(LedgerType.EXPENSE));
        BigDecimal ledgerEquity = snap.total(LedgerType.EQUITY).add(currentResult);
        BigDecimal equity = assets.subtract(liabilities);
        List<LineItem> equityItems = new ArrayList<>(snap.lines(LedgerType.EQUITY));
        equityItems.add(new LineItem(ChartOfAccountsTemplate.RETAINED, "Laba Ditahan (akumulasi hasil)", currentResult));
        return new BalanceSheetResponse(asOf, assets, liabilities, equity, snap.lines(LedgerType.ASSET), snap.lines(LedgerType.LIABILITY),
                equityItems, equity.compareTo(ledgerEquity) == 0);
    }
}
