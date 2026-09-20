package com.example.personalfinance.service;

import com.example.personalfinance.domain.accounting.LedgerType;
import com.example.personalfinance.domain.common.Money;
import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.dto.response.BalanceSheetResponse;
import com.example.personalfinance.dto.response.NetWorthPoint;
import com.example.personalfinance.repository.JournalEntryRepository;
import com.example.personalfinance.repository.projection.MonthlyDelta;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/** Net worth = Assets − Liabilities; history is rebuilt month by month from ledger movements (no stored snapshots). */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NetWorthService {

    private final JournalEntryRepository entries;
    private final BalanceSheetService balanceSheet;

    public NetWorthPoint current(User user, LocalDate date) {
        BalanceSheetResponse bs = balanceSheet.asOf(user, date);
        return new NetWorthPoint(date, bs.totalAssets(), bs.totalLiabilities(), bs.equity());
    }

    /** One point per month that had ledger activity, dated at month end. */
    public List<NetWorthPoint> history(User user) {
        Map<YearMonth, BigDecimal[]> byMonth = new TreeMap<>();
        for (MonthlyDelta d : entries.monthlyDeltas(user.getId())) {
            BigDecimal[] acc = byMonth.computeIfAbsent(YearMonth.of(d.year(), d.month()), k -> new BigDecimal[]{Money.ZERO, Money.ZERO});
            if (d.type() == LedgerType.ASSET) acc[0] = acc[0].add(d.amount());
            if (d.type() == LedgerType.LIABILITY) acc[1] = acc[1].subtract(d.amount());
        }
        List<NetWorthPoint> points = new ArrayList<>();
        BigDecimal assets = Money.ZERO, liabilities = Money.ZERO;
        for (Map.Entry<YearMonth, BigDecimal[]> e : byMonth.entrySet()) {
            assets = assets.add(e.getValue()[0]);
            liabilities = liabilities.add(e.getValue()[1]);
            points.add(new NetWorthPoint(e.getKey().atEndOfMonth(), assets, liabilities, assets.subtract(liabilities)));
        }
        return points;
    }
}
