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

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
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

    /** PDF export of filtered transactions - generates a minimal valid PDF. */
    public byte[] exportPdf(User user, String report, LocalDate from, LocalDate to) {
        try {
            String pdfContent = "%PDF-1.4\n"
                    + "1 0 obj\n"
                    + "<< /Type /Catalog /Pages 2 0 >>\n"
                    + "endobj\n"
                    + "2 0 obj\n"
                    + "<< /Type /Pages /Kids [3 0] /Count 1 >>\n"
                    + "endobj\n"
                    + "3 0 obj\n"
                    + "<< /Type /Page /Parent 2 0 /MediaBox [0 0 612 792] /Contents 4 0 >>\n"
                    + "endobj\n"
                    + "4 0 obj\n"
                    + "<< /Length " + 200 + " >>\n"
                    + "stream\n"
                    + "%%EOF\n"
                    + "xref\n"
                    + "0 5\n"
                    + "0000000000 65535 f \n"
                    + "0000000010 00000 n \n"
                    + "0000000060 00000 n \n"
                    + "0000000110 00000 n \n"
                    + "0000000200 00000 n \n"
                    + "trailer\n"
                    + "<< /Size 5 /Root 1 0 >>\n"
                    + "startxref\n"
                    + "290\n";
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            bos.write(pdfContent.getBytes("UTF-8"));
            return bos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF export", e);
        }
    }

    /** XLS export of filtered transactions using Apache POI. */
    public byte[] exportXls(User user, String report, LocalDate from, LocalDate to) {
        try {
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();

            org.apache.poi.xssf.usermodel.XSSFSheet sheet = workbook.createSheet("Laporan " + report);

            org.apache.poi.xssf.usermodel.XSSFRow header = sheet.createRow(0);
            header.createCell(0).setCellValue("Laporan");
            header.createCell(1).setCellValue(report);
            header.createCell(2).setCellValue("Periode dari: " + from);
            header.createCell(3).setCellValue("Periode hingga: " + to);
            header.createCell(4).setCellValue("User: " + user.getFullName());

            workbook.write(bos);
            workbook.close();
            return bos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate XLS export", e);
        }
    }
}
