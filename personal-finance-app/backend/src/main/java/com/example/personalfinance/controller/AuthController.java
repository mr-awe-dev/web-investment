package com.example.personalfinance.controller;

import com.example.personalfinance.dto.request.LoginRequest;
import com.example.personalfinance.dto.request.RegisterRequest;
import com.example.personalfinance.dto.request.SettingsRequest;
import com.example.personalfinance.dto.response.ApiResponse;
import com.example.personalfinance.dto.response.AuthResponse;
import com.example.personalfinance.dto.response.UserResponse;
import com.example.personalfinance.mapper.DtoMapper;
import com.example.personalfinance.security.UserPrincipal;
import com.example.personalfinance.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Public authentication endpoints plus the current-user profile/settings. */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService auth;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest req) { return ApiResponse.ok(auth.register(req)); }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest req) { return ApiResponse.ok(auth.login(req)); }

    @GetMapping("/me")
    public ApiResponse<UserResponse> me(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(DtoMapper.user(p.user())); }

    @PutMapping("/settings")
    public ApiResponse<UserResponse> settings(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody SettingsRequest req) {
        return ApiResponse.ok(auth.updateSettings(p.user(), req));
    }
}
