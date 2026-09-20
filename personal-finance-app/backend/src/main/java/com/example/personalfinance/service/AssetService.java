package com.example.personalfinance.service;

import com.example.personalfinance.domain.asset.Asset;
import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.dto.request.AssetRequest;
import com.example.personalfinance.dto.request.PriceUpdateRequest;
import com.example.personalfinance.dto.response.AssetResponse;
import com.example.personalfinance.exception.BusinessException;
import com.example.personalfinance.exception.NotFoundException;
import com.example.personalfinance.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/** Asset master data. Holdings are derived by {@link PortfolioService}; only prices are edited here. */
@Service
@RequiredArgsConstructor
@Transactional
public class AssetService {

    private final AssetRepository repo;
    private final ChartOfAccountService coa;
    private final PortfolioService portfolio;

    public AssetResponse create(User user, AssetRequest req) {
        String code = req.code().toUpperCase();
        if (repo.existsByUserIdAndCode(user.getId(), code)) throw new BusinessException("DUPLICATE_CODE", "Kode aset sudah digunakan");
        Asset a = new Asset();
        a.setUser(user);
        a.setCode(code);
        a.setName(req.name());
        a.setAssetType(req.assetType());
        a.setCurrency(req.currency().toUpperCase());
        a.setQuantityUnit(req.quantityUnit());
        a.setSector(req.sector());
        a.setCurrentPrice(req.currentPrice() == null ? BigDecimal.ZERO : req.currentPrice());
        a.setLedgerAccount(coa.createSubAccount(user, req.assetType().parentCode(), req.name(), false));
        repo.save(a);
        return get(user, a.getId());
    }

    /** Updates the market price; this never creates journal entries or cash flow. */
    public AssetResponse updatePrice(User user, Long id, PriceUpdateRequest req) {
        Asset a = owned(user, id);
        a.setCurrentPrice(req.currentPrice());
        a.setValuationDate(req.valuationDate());
        return get(user, id);
    }

    public Asset owned(User user, Long id) {
        return repo.findByIdAndUserId(id, user.getId()).orElseThrow(() -> new NotFoundException("Aset"));
    }

    @Transactional(readOnly = true)
    public AssetResponse get(User user, Long id) {
        owned(user, id);
        return portfolio.positions(user, false).stream().filter(p -> p.id().equals(id)).findFirst().orElseThrow();
    }

    @Transactional(readOnly = true)
    public List<AssetResponse> list(User user) {
        return portfolio.positions(user, false);
    }
}
