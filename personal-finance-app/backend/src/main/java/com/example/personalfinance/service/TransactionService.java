package com.example.personalfinance.service;

import com.example.personalfinance.domain.account.Account;
import com.example.personalfinance.domain.accounting.ChartOfAccount;
import com.example.personalfinance.domain.accounting.JournalEntry;
import com.example.personalfinance.domain.accounting.LedgerType;
import com.example.personalfinance.domain.asset.Asset;
import com.example.personalfinance.domain.common.Money;
import com.example.personalfinance.domain.liability.Liability;
import com.example.personalfinance.domain.transaction.Transaction;
import com.example.personalfinance.domain.transaction.TransactionStatus;
import com.example.personalfinance.domain.transaction.TransactionType;
import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.dto.request.TransactionRequest;
import com.example.personalfinance.dto.response.*;
import com.example.personalfinance.exception.BusinessException;
import com.example.personalfinance.exception.NotFoundException;
import com.example.personalfinance.mapper.DtoMapper;
import com.example.personalfinance.repository.JournalEntryRepository;
import com.example.personalfinance.repository.JournalRepository;
import com.example.personalfinance.repository.TransactionRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Application service for the central domain. One atomic unit of work per operation:
 * validate → persist transaction → lots → journal. Any failure rolls everything back.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class TransactionService {

    private final TransactionRepository transactions;
    private final JournalRepository journals;
    private final JournalEntryRepository entries;
    private final AccountService accounts;
    private final ChartOfAccountService coa;
    private final AssetService assets;
    private final LiabilityService liabilities;
    private final LedgerService ledger;
    private final PortfolioService portfolio;
    private final AccountingService accounting;

    /** Optional list filters. */
    public record Filter(LocalDate from, LocalDate to, TransactionType type, Long accountId, Long assetId, String search) {}

    public TransactionDetailResponse create(User user, TransactionRequest req) {
        Transaction tx = new Transaction();
        tx.setUser(user);
        apply(user, tx, req);
        transactions.save(tx);
        portfolio.applyLots(tx, req.lotIds());
        accounting.post(tx);
        return detail(user, tx.getId());
    }

    /** Re-posts: reverts lots and journal, then applies the new payload under the same id. */
    public TransactionDetailResponse update(User user, Long id, TransactionRequest req) {
        Transaction tx = posted(user, id);
        reverse(tx);
        apply(user, tx, req);
        portfolio.applyLots(tx, req.lotIds());
        accounting.post(tx);
        return detail(user, id);
    }

    /** Voids the transaction: journal and lot effects are removed, the record is kept for audit. */
    public void delete(User user, Long id) {
        Transaction tx = posted(user, id);
        reverse(tx);
        tx.setStatus(TransactionStatus.VOID);
    }

    private void reverse(Transaction tx) {
        portfolio.revertLots(tx);
        accounting.unpost(tx);
    }

    private Transaction posted(User user, Long id) {
        Transaction tx = owned(user, id);
        require(tx.getStatus() == TransactionStatus.POSTED, "TRANSACTION_VOID", "Transaksi sudah dibatalkan");
        return tx;
    }

    public Transaction owned(User user, Long id) {
        return transactions.findByIdAndUserId(id, user.getId()).orElseThrow(() -> new NotFoundException("Transaksi"));
    }

    /** Resolves references (with ownership checks), validates type-specific rules and computes derived amounts. */
    private void apply(User user, Transaction tx, TransactionRequest r) {
        TransactionType type = r.type();
        Account account = accounts.owned(user, r.accountId());
        Account destination = null;
        ChartOfAccount category = null;
        Asset asset = null;
        Liability liability = null;

        if (type == TransactionType.TRANSFER) {
            require(r.destinationAccountId() != null, "DESTINATION_REQUIRED", "Akun tujuan wajib diisi untuk transfer");
            destination = accounts.owned(user, r.destinationAccountId());
            require(!destination.getId().equals(account.getId()), "SAME_ACCOUNT", "Akun sumber dan tujuan tidak boleh sama");
        }
        if (type.requiresCategory()) {
            require(r.categoryId() != null, "CATEGORY_REQUIRED", "Kategori wajib diisi");
            category = coa.owned(user, r.categoryId());
            LedgerType expected = type == TransactionType.INCOME ? LedgerType.INCOME : LedgerType.EXPENSE;
            require(category.getType() == expected, "CATEGORY_TYPE_MISMATCH", "Kategori tidak sesuai dengan tipe transaksi");
        }
        if (type.requiresAsset()) {
            require(r.assetId() != null, "ASSET_REQUIRED", "Aset wajib diisi");
            asset = assets.owned(user, r.assetId());
        }
        if (type.requiresLiability()) {
            require(r.liabilityId() != null, "LIABILITY_REQUIRED", "Liabilitas wajib diisi");
            liability = liabilities.owned(user, r.liabilityId());
        }

        BigDecimal gross;
        if (type.isAcquisition() || type.isDisposal()) {
            require(r.quantity() != null && r.quantityUnit() != null && r.unitPrice() != null,
                    "QUANTITY_REQUIRED", "Kuantitas, unit, dan harga satuan wajib diisi");
        }
        if (r.quantity() != null && r.unitPrice() != null) {
            gross = Money.mul(r.quantity(), r.unitPrice());
        } else {
            require(r.grossAmount() != null, "AMOUNT_REQUIRED", "Jumlah wajib diisi");
            gross = Money.of(r.grossAmount());
        }
        BigDecimal fees = Money.of(r.adminFee()).add(Money.of(r.brokerFee())).add(Money.of(r.levy()));
        BigDecimal tax = Money.of(r.tax());
        BigDecimal interest = Money.of(r.interestAmount());
        if (type == TransactionType.DEBT_PAYMENT) {
            BigDecimal outstanding = ledger.balanceOf(user, liability.getLedgerAccount(), LedgerService.MAX);
            require(gross.compareTo(outstanding) <= 0, "DEBT_EXCEEDED", "Pembayaran pokok melebihi saldo utang");
        }

        tx.setTransactionDate(r.transactionDate());
        tx.setType(type);
        tx.setAccount(account);
        tx.setDestinationAccount(destination);
        tx.setCategory(category);
        tx.setAsset(asset);
        tx.setLiability(liability);
        tx.setQuantity(r.quantity());
        tx.setQuantityUnit(r.quantityUnit());
        tx.setUnitPrice(r.unitPrice());
        tx.setGrossAmount(gross);
        tx.setAdminFee(Money.of(r.adminFee()));
        tx.setBrokerFee(Money.of(r.brokerFee()));
        tx.setLevy(Money.of(r.levy()));
        tx.setTax(tax);
        tx.setInterestAmount(interest);
        tx.setNetAmount(type.netAmount(gross, fees, tax, interest));
        tx.setCurrency(r.currency() == null ? account.getCurrency() : r.currency().toUpperCase());
        tx.setExchangeRate(r.exchangeRate() == null ? BigDecimal.ONE : r.exchangeRate());
        tx.setBaseCurrency(user.getBaseCurrency());
        tx.setBaseAmount(Money.mul(tx.getNetAmount(), tx.getExchangeRate()));
        tx.setReference(r.reference());
        tx.setDescription(r.description());
        tx.setCostBasis(null);
        tx.setRealizedPl(null);
    }

    private static void require(boolean condition, String code, String message) {
        if (!condition) throw new BusinessException(code, message);
    }

    @Transactional(readOnly = true)
    public PageResponse<TransactionResponse> list(User user, Filter f, Pageable pageable) {
        Page<Transaction> page = transactions.findAll(spec(user, f), pageable);
        return new PageResponse<>(page.getContent().stream().map(DtoMapper::transaction).toList(),
                page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> listAll(User user, Filter f) {
        return transactions.findAll(spec(user, f)).stream()
                .sorted((a, b) -> b.getTransactionDate().compareTo(a.getTransactionDate()))
                .map(DtoMapper::transaction).toList();
    }

    private static Specification<Transaction> spec(User user, Filter f) {
        return (root, q, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            ps.add(cb.equal(root.get("user").get("id"), user.getId()));
            if (f.from() != null) ps.add(cb.greaterThanOrEqualTo(root.get("transactionDate"), f.from()));
            if (f.to() != null) ps.add(cb.lessThanOrEqualTo(root.get("transactionDate"), f.to()));
            if (f.type() != null) ps.add(cb.equal(root.get("type"), f.type()));
            if (f.accountId() != null) ps.add(cb.or(cb.equal(root.get("account").get("id"), f.accountId()),
                    cb.equal(root.get("destinationAccount").get("id"), f.accountId())));
            if (f.assetId() != null) ps.add(cb.equal(root.get("asset").get("id"), f.assetId()));
            if (f.search() != null && !f.search().isBlank()) {
                String like = "%" + f.search().toLowerCase() + "%";
                ps.add(cb.or(cb.like(cb.lower(root.get("reference")), like), cb.like(cb.lower(root.get("description")), like)));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };
    }

    /** Transaction with its journal, portfolio, cash-flow and P/L impact. */
    @Transactional(readOnly = true)
    public TransactionDetailResponse detail(User user, Long id) {
        Transaction tx = owned(user, id);
        List<JournalEntry> lines = journals.findByTransactionId(id).map(j -> entries.findByJournalId(j.getId())).orElse(List.of());
        BigDecimal cashImpact = lines.stream().filter(e -> e.getLedgerAccount().isCash())
                .map(e -> e.getDebit().subtract(e.getCredit())).reduce(Money.ZERO, BigDecimal::add);
        BigDecimal qtyImpact = tx.getType().isAcquisition() ? tx.getQuantity() : tx.getType().isDisposal() ? tx.getQuantity().negate() : null;
        return new TransactionDetailResponse(DtoMapper.transaction(tx), lines.stream().map(DtoMapper::entry).toList(), qtyImpact,
                tx.getType().cashFlowCategory(), cashImpact, tx.getRealizedPl(), portfolio.consumptions(id));
    }
}
