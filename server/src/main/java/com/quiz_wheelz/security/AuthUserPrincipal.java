package com.quiz_wheelz.security;

import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.UserRole;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collection;
import java.util.List;

public class AuthUserPrincipal {

    private final Long userId;
    private final String username;
    private final String displayName;
    private final UserRole role;
    private final Collection<? extends GrantedAuthority> authorities;

    private AuthUserPrincipal(
            Long userId,
            String username,
            String displayName,
            UserRole role,
            Collection<? extends GrantedAuthority> authorities
    ) {
        this.userId = userId;
        this.username = username;
        this.displayName = displayName;
        this.role = role;
        this.authorities = authorities;
    }

    public static AuthUserPrincipal from(User user) {
        UserRole role = user.getRole();

        return new AuthUserPrincipal(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                role,
                List.of(new SimpleGrantedAuthority(SecurityConstants.ROLE_PREFIX + role.name()))
        );
    }

    public Long getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public UserRole getRole() {
        return role;
    }

    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }
}