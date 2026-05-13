package com.azobioz.account.service;

import com.azobioz.account.model.RefreshToken;
import com.azobioz.account.model.User;
import com.azobioz.account.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional
    public RefreshToken createOrUpdateRefreshToken(User user) {
        // Если у пользователя уже есть refresh-токен — обновляем его (One-to-One)
        RefreshToken existing = user.getRefreshToken();

        String newToken = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusDays(30);

        if (existing != null) {
            existing.setRefreshToken(newToken);
            existing.setExpiredAt(expiresAt);
            existing.setCreatedAt(now);
            existing.setRevoked(false);
            return refreshTokenRepository.save(existing);
        }
        else {
            RefreshToken refreshToken = new RefreshToken();
            refreshToken.setRefreshToken(newToken);
            refreshToken.setExpiredAt(expiresAt);
            refreshToken.setCreatedAt(now);
            refreshToken.setRevoked(false);
            refreshToken.setUser(user);

            // Синхронизируем двунаправленную связь
            user.setRefreshToken(refreshToken);

            return refreshTokenRepository.save(refreshToken);
        }
    }

    @Transactional
    public RefreshToken validateAndRotate(String token) {
        RefreshToken refresh = refreshTokenRepository.findByRefreshToken(token)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));

        if (refresh.isRevoked() || refresh.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Refresh token is invalid or expired");
        }

        // Ротация: создаём новый токен
        return createOrUpdateRefreshToken(refresh.getUser());
    }

    @Transactional
    public void revokeRefreshToken(String token) {
        refreshTokenRepository.findByRefreshToken(token)
                .ifPresent(refresh -> {
                    refresh.setRevoked(true);
                    refreshTokenRepository.save(refresh);
                });
    }
}
