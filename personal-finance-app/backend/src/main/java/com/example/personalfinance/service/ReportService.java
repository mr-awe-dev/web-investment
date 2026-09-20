package com.example.personalfinance.service;

import com.example.personalfinance.domain.accounting.LedgerType;
import com.example.personalfinance.domain.transaction.TransactionType;
import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.dto.response.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Composes dashboard and cross-module reports from the dedicated services (no financial logic of its own). */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final LedgerService ledger;
    private final BalanceSheetService balanceSheet;
    private final ProfitLossService profitLoss;
    private final CashFlowService cashFlow;
    private final NetWorthService netWorth;
    private final PortfolioService portfolio;
    private final BondService bonds;
    private final LiabilityService liabilities;
    private final TransactionService transactions;

    public DashboardResponse dashboard(User user) {
        LocalDate today = LocalDate.now();
        BalanceSheetResponse bs = balanceSheet.asOf(user, today);
        LedgerService.LedgerSnapshot snap = ledger.snapshot(user, LedgerService.MIN, today);
        var cash = snap.cash();
        var investments = snap.total(LedgerType.ASSET).subtract(cash);
        List<LineItem> allocation = portfolio.positions(user, true).stream()
                .map(p -> new LineItem(p.code(), p.name(), p.marketValue())).toList();
        var recent = transactions.list(user, new TransactionService.Filter(null, null, null, null, null, null),
                PageRequest.of(0, 8, Sort.by(Sort.Direction.DESC, "transactionDate", "id"))).content();
        return new DashboardResponse(bs.totalAssets(), investments, cash, bs.totalLiabilities(), bs.equity(),
                profitLoss.investmentIncome(user, LedgerService.MIN, LedgerService.MAX), netWorth.history(user), allocation,
                cashFlow.statement(user, today.withDayOfYear(1), today), upcoming(user, today), recent);
    }

    /** Upcoming coupons (next 90 days) and liabilities with a future due date. */
    private List<DashboardResponse.UpcomingItem> upcoming(User user, LocalDate today) {
        List<DashboardResponse.UpcomingItem> items = new ArrayList<>();
        LocalDate horizon = today.plusDays(90);
        for (CouponResponse c : bonds.coupons(user)) {
            if (c.paymentDate().isAfter(today) && !c.paymentDate().isAfter(horizon))
                items.add(new DashboardResponse.UpcomingItem("COUPON", c.assetCode(), c.paymentDate(), c.net()));
        }
        for (LiabilityResponse l : liabilities.list(user)) {
            if (l.dueDate() != null && l.installment() != null && !l.dueDate().isBefore(today) && l.outstanding().signum() > 0)
                items.add(new DashboardResponse.UpcomingItem("DEBT_PAYMENT", l.name(), l.dueDate(), l.installment()));
        }
        items.sort((a, b) -> a.date().compareTo(b.date()));
        return items;
    }

    /** Dividend or coupon receipt history. */
    public List<TransactionResponse> history(User user, TransactionType type) {
        return transactions.listAll(user, new TransactionService.Filter(null, null, type, null, null, null));
    }

    /** CSV export of the filtered transaction list. */
    public String exportCsv(User user, TransactionService.Filter filter) {
        StringBuilder sb = new StringBuilder("id,tanggal,tipe,akun,akun_tujuan,kategori,aset,liabilitas,kuantitas,unit,harga_satuan,bruto,biaya_admin,biaya_broker,levy,pajak,bunga,neto,cost_basis,realized_pl,mata_uang,kurs,jumlah_dasar,referensi,deskripsi,status\n");
        for (TransactionResponse t : transactions.listAll(user, filter)) {
            sb.append(String.join(",", csv(t.id()), csv(t.transactionDate()), csv(t.type()), csv(t.accountName()), csv(t.destinationAccountName()),
                    csv(t.categoryName()), csv(t.assetCode()), csv(t.liabilityName()), csv(t.quantity()), csv(t.quantityUnit()), csv(t.unitPrice()),
                    csv(t.grossAmount()), csv(t.adminFee()), csv(t.brokerFee()), csv(t.levy()), csv(t.tax()), csv(t.interestAmount()), csv(t.netAmount()),
                    csv(t.costBasis()), csv(t.realizedPl()), csv(t.currency()), csv(t.exchangeRate()), csv(t.baseAmount()), csv(t.reference()),
                    csv(t.description()), csv(t.status()))).append('\n');
        }
        return sb.toString();
    }

    private static String csv(Object v) {
        if (v == null) return "";
        String s = v.toString();
        return s.contains(",") || s.contains("\"") ? "\"" + s.replace("\"", "\"\"") + "\"" : s;
    }
}
