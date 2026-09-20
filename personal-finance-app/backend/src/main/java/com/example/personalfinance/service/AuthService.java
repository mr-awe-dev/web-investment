package com.example.personalfinance.service;

import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.dto.request.LoginRequest;
import com.example.personalfinance.dto.request.RegisterRequest;
import com.example.personalfinance.dto.request.SettingsRequest;
import com.example.personalfinance.dto.response.AuthResponse;
import com.example.personalfinance.dto.response.UserResponse;
import com.example.personalfinance.exception.ApiException;
import com.example.personalfinance.mapper.DtoMapper;
import com.example.personalfinance.repository.UserRepository;
import com.example.personalfinance.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Registration (with chart-of-accounts bootstrap), login and user settings. */
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final AuthenticationManager authenticationManager;
    private final ChartOfAccountService coa;

    public AuthResponse register(RegisterRequest req) {
        if (users.existsByEmailIgnoreCase(req.email())) throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email sudah terdaftar");
        User u = new User();
        u.setEmail(req.email().toLowerCase());
        u.setPasswordHash(encoder.encode(req.password()));
        u.setFullName(req.fullName());
        users.save(u);
        coa.seedTemplate(u);
        return new AuthResponse(jwt.generate(u.getId()), DtoMapper.user(u));
    }

    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(req.email(), req.password()));
        User u = users.findByEmailIgnoreCase(req.email()).orElseThrow();
        return new AuthResponse(jwt.generate(u.getId()), DtoMapper.user(u));
    }

    public UserResponse updateSettings(User user, SettingsRequest req) {
        User u = users.findById(user.getId()).orElseThrow();
        u.setBaseCurrency(req.baseCurrency().toUpperCase());
        u.setCostBasisMethod(req.costBasisMethod());
        u.setFullName(req.fullName());
        return DtoMapper.user(u);
    }
}
