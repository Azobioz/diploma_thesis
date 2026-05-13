package com.azobioz.aggregator.dto.board.element;

import java.time.LocalDateTime;

public record CommentReplyDto(
        Long id,
        String message,
        Long userId,
        LocalDateTime createdAt
) { }
