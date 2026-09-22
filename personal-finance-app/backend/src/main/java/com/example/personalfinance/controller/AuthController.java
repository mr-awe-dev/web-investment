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
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Public authentication endpoints plus the current-user profile/settings. */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User registration, login, and profile management")
public class AuthController {

    private final AuthService auth;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register new user", description = "Create a new user account with email and password")
    @SecurityRequirements
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest req) { return ApiResponse.ok(auth.register(req)); }

    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticate user and return JWT token")
    @SecurityRequirements
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest req) { return ApiResponse.ok(auth.login(req)); }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Retrieve authenticated user profile")
    public ApiResponse<UserResponse> me(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(DtoMapper.user(p.user())); }

    @PutMapping("/settings")
    @Operation(summary = "Update user settings", description = "Update authenticated user settings")
    public ApiResponse<UserResponse> settings(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody SettingsRequest req) {
        return ApiResponse.ok(auth.updateSettings(p.user(), req));
    }
}
