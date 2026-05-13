package com.azobioz.aggregator.dto.user;

public record AuthResponse(TokenResponse tokenResponse, String refreshToken, Long spaceId) {
}
