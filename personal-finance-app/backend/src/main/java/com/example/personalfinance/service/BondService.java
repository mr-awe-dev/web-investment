package com.example.personalfinance.service;

import com.example.personalfinance.domain.asset.Asset;
import com.example.personalfinance.domain.asset.AssetType;
import com.example.personalfinance.domain.bond.Bond;
import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.dto.request.BondRequest;
import com.example.personalfinance.dto.response.BondResponse;
import com.example.personalfinance.dto.response.CouponResponse;
import com.example.personalfinance.exception.BusinessException;
import com.example.personalfinance.mapper.DtoMapper;
import com.example.personalfinance.repository.BondRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Bond terms and derived coupon schedules. Actual coupon receipts are COUPON transactions. */
@Service
@RequiredArgsConstructor
@Transactional
public class BondService {

    private final BondRepository repo;
    private final AssetService assets;

    public BondResponse create(User user, BondRequest req) {
        Asset asset = assets.owned(user, req.assetId());
        if (asset.getAssetType() != AssetType.BOND) throw new BusinessException("ASSET_NOT_BOND", "Aset harus bertipe obligasi");
        if (!req.maturityDate().isAfter(req.settlementDate())) throw new BusinessException("INVALID_MATURITY", "Tanggal jatuh tempo harus setelah settlement");
        Bond b = new Bond();
        b.setUser(user);
        b.setAsset(asset);
        b.setIssuer(req.issuer());
        b.setBondType(req.bondType());
        b.setNominalValue(req.nominalValue());
        b.setCouponRate(req.couponRate());
        b.setTaxRate(req.taxRate() == null ? BigDecimal.ZERO : req.taxRate());
        b.setFrequency(req.frequency());
        b.setSettlementDate(req.settlementDate());
        b.setMaturityDate(req.maturityDate());
        return DtoMapper.bond(repo.save(b), LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<BondResponse> list(User user) {
        LocalDate today = LocalDate.now();
        return repo.findByUserIdOrderByMaturityDate(user.getId()).stream().map(b -> DtoMapper.bond(b, today)).toList();
    }

    /** Flattened coupon schedule across all bonds, ordered by payment date. */
    @Transactional(readOnly = true)
    public List<CouponResponse> coupons(User user) {
        LocalDate today = LocalDate.now();
        return repo.findByUserIdOrderByMaturityDate(user.getId()).stream()
                .flatMap(b -> b.schedule(today).stream().map(c -> new CouponResponse(b.getId(), b.getAsset().getCode(), b.getAsset().getName(),
                        c.paymentDate(), c.gross(), c.tax(), c.net(), c.status())))
                .sorted((a, c) -> a.paymentDate().compareTo(c.paymentDate())).toList();
    }
}
