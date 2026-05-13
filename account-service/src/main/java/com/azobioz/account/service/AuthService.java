package com.azobioz.account.service;

import com.azobioz.account.dto.AuthResponse;
import com.azobioz.account.dto.LoginRequest;
import com.azobioz.account.dto.RegisterRequest;
import com.azobioz.account.dto.TokenResponse;
import com.azobioz.account.model.RefreshToken;
import com.azobioz.account.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final TokenService tokenService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        User user = tokenService.register(request);
        return generateAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = tokenService.login(request);
        return generateAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(String oldRefreshToken) {
        RefreshToken newRefresh = refreshTokenService.validateAndRotate(oldRefreshToken);
        User user = newRefresh.getUser();

        String accessToken = jwtTokenProvider.createAccessToken(user.getId());
        String newRefreshTokenValue = newRefresh.getRefreshToken();

        TokenResponse tokenResponse = new TokenResponse(accessToken, user.getId(), "Bearer", 900);

        return new AuthResponse(tokenResponse, newRefreshTokenValue);
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenService.revokeRefreshToken(refreshToken);
    }

    private AuthResponse generateAuthResponse(User user) {
        // Создаём Access JWT
        String accessToken = jwtTokenProvider.createAccessToken(user.getId());

        // Создаём/обновляем Refresh Token
        RefreshToken refreshToken = refreshTokenService.createOrUpdateRefreshToken(user);

        TokenResponse tokenResponse = new TokenResponse(
                accessToken,
                user.getId(),
                "Bearer",
                900   // 15 минут
        );

        return new AuthResponse(tokenResponse, refreshToken.getRefreshToken());
    }

}
