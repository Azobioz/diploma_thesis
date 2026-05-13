package com.azobioz.aggregator.dto.user;

public record UserAvatarDto(Long userId,
                            String nickname,
                            byte[] avatar
                            ) {
}
