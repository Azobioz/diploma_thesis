package com.azobioz.aggregator.dto.invite;

import java.time.LocalDateTime;

public record InvitationLinkResponse(
        String token,
        String inviteUrl,
        LocalDateTime expiresAt
) {
}
