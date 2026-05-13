package com.azobioz.task.dto;

import java.time.LocalDateTime;

public record TaskCommentDto(Long taskCommentId,
                             String message,
                             LocalDateTime createdAt,
                             Long commentCreatedByUserId
) { }
