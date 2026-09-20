package com.example.personalfinance.security;

import com.example.personalfinance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/** Loads users by email for Spring Security's authentication manager. */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository users;

    @Override
    public UserDetails loadUserByUsername(String email) {
        return users.findByEmailIgnoreCase(email).map(UserPrincipal::new)
                .orElseThrow(() -> new UsernameNotFoundException("Pengguna tidak ditemukan"));
    }

    /** Loads a principal by primary key; used by the JWT filter. */
    public UserDetails loadById(Long id) {
        return users.findById(id).map(UserPrincipal::new)
                .orElseThrow(() -> new UsernameNotFoundException("Pengguna tidak ditemukan"));
    }
}
