package com.azobioz.aggregator.dto.task;

import java.time.LocalDateTime;

public record TaskCommentDto(Long taskCommentId,
                             String message,
                             LocalDateTime createdAt,
                             Long commentCreatedByUserId) {
}
