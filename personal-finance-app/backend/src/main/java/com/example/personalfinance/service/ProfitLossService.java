package com.example.personalfinance.service;

import com.example.personalfinance.domain.accounting.ChartOfAccountsTemplate;
import com.example.personalfinance.domain.accounting.LedgerType;
import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.dto.response.IncomeExpenseResponse;
import com.example.personalfinance.dto.response.InvestmentIncomeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Income statement and investment-return decomposition from the ledger. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfitLossService {

    private final LedgerService ledger;
    private final PortfolioService portfolio;

    public IncomeExpenseResponse incomeExpense(User user, LocalDate from, LocalDate to) {
        LedgerService.LedgerSnapshot snap = ledger.snapshot(user, from, to);
        BigDecimal income = snap.total(LedgerType.INCOME);
        BigDecimal expense = snap.total(LedgerType.EXPENSE);
        return new IncomeExpenseResponse(from, to, income, expense, income.subtract(expense), snap.lines(LedgerType.INCOME), snap.lines(LedgerType.EXPENSE));
    }

    /** Realized + unrealized + dividend + coupon + interest − fees − taxes. Unrealized is always as of today (from lots). */
    public InvestmentIncomeResponse investmentIncome(User user, LocalDate from, LocalDate to) {
        LedgerService.LedgerSnapshot snap = ledger.snapshot(user, from, to);
        BigDecimal dividend = snap.ofCode(ChartOfAccountsTemplate.DIVIDEND_INCOME);
        BigDecimal coupon = snap.ofCode(ChartOfAccountsTemplate.COUPON_INCOME);
        BigDecimal interest = snap.ofCode(ChartOfAccountsTemplate.INTEREST_INCOME);
        BigDecimal realized = snap.ofCode(ChartOfAccountsTemplate.REALIZED_GAIN);
        BigDecimal fees = snap.ofCode(ChartOfAccountsTemplate.INVESTMENT_FEE);
        BigDecimal taxes = snap.ofCode(ChartOfAccountsTemplate.TAX);
        BigDecimal unrealized = portfolio.portfolio(user).unrealizedPl();
        BigDecimal total = realized.add(unrealized).add(dividend).add(coupon).add(interest).subtract(fees).subtract(taxes);
        return new InvestmentIncomeResponse(from, to, dividend, coupon, interest, realized, unrealized, fees, taxes, total);
    }
}
