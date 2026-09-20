package com.example.personalfinance.mapper;

import com.example.personalfinance.domain.account.Account;
import com.example.personalfinance.domain.accounting.JournalEntry;
import com.example.personalfinance.domain.bond.Bond;
import com.example.personalfinance.domain.liability.Liability;
import com.example.personalfinance.domain.portfolio.LotConsumption;
import com.example.personalfinance.domain.portfolio.StockLot;
import com.example.personalfinance.domain.transaction.Transaction;
import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.dto.response.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Entity → DTO conversions. Entities are never exposed through the API. */
public final class DtoMapper {

    private DtoMapper() {}

    public static UserResponse user(User u) {
        return new UserResponse(u.getId(), u.getEmail(), u.getFullName(), u.getBaseCurrency(), u.getCostBasisMethod());
    }

    public static AccountResponse account(Account a, BigDecimal balance) {
        return new AccountResponse(a.getId(), a.getName(), a.getCategory(), a.getCurrency(), a.getInstitution(),
                a.getLedgerAccount().getCode(), balance, a.isActive());
    }

    public static LiabilityResponse liability(Liability l, BigDecimal outstanding) {
        return new LiabilityResponse(l.getId(), l.getName(), l.getCreditor(), l.getLiabilityType(), l.getCurrency(), l.getInterestRate(),
                l.getTenorMonths(), l.getInstallment(), l.getDueDate(), l.getLedgerAccount().getCode(), outstanding,
                outstanding.signum() > 0 ? "ACTIVE" : "PAID_OFF");
    }

    public static TransactionResponse transaction(Transaction t) {
        return new TransactionResponse(t.getId(), t.getTransactionDate(), t.getType(), t.getType().cashFlowCategory(),
                t.getAccount().getId(), t.getAccount().getName(),
                t.getDestinationAccount() == null ? null : t.getDestinationAccount().getId(),
                t.getDestinationAccount() == null ? null : t.getDestinationAccount().getName(),
                t.getCategory() == null ? null : t.getCategory().getId(), t.getCategory() == null ? null : t.getCategory().getName(),
                t.getAsset() == null ? null : t.getAsset().getId(), t.getAsset() == null ? null : t.getAsset().getCode(),
                t.getLiability() == null ? null : t.getLiability().getId(), t.getLiability() == null ? null : t.getLiability().getName(),
                t.getQuantity(), t.getQuantityUnit(), t.getUnitPrice(), t.getGrossAmount(), t.getAdminFee(), t.getBrokerFee(), t.getLevy(),
                t.getTax(), t.getInterestAmount(), t.getNetAmount(), t.getCostBasis(), t.getRealizedPl(), t.getCurrency(), t.getExchangeRate(),
                t.getBaseCurrency(), t.getBaseAmount(), t.getReference(), t.getDescription(), t.getStatus());
    }

    public static JournalEntryResponse entry(JournalEntry e) {
        return new JournalEntryResponse(e.getLedgerAccount().getCode(), e.getLedgerAccount().getName(), e.getDebit(), e.getCredit(), e.getMemo());
    }

    public static StockLotResponse lot(StockLot l) {
        return new StockLotResponse(l.getId(), l.getAsset().getId(), l.getAsset().getCode(), l.getTransaction().getId(), l.getPurchaseDate(),
                l.getQuantity(), l.getRemainingQuantity(), l.unitCost(), l.getTotalCost(), l.getRemainingCost(), l.getStatus());
    }

    public static LotConsumptionResponse consumption(LotConsumption c) {
        return new LotConsumptionResponse(c.getLot().getId(), c.getLot().getPurchaseDate(), c.getQuantity(), c.getCostBasis());
    }

    public static BondResponse bond(Bond b, LocalDate today) {
        return new BondResponse(b.getId(), b.getAsset().getId(), b.getAsset().getCode(), b.getAsset().getName(), b.getIssuer(), b.getBondType(),
                b.getNominalValue(), b.getCouponRate(), b.getTaxRate(), b.getFrequency(), b.getSettlementDate(), b.getMaturityDate(), b.schedule(today));
    }
}
