package com.azobioz.aggregator.dto.task;

import com.azobioz.aggregator.dto.user.UserDto;

import java.time.LocalDateTime;

public record GetCommentFullInfo(Long taskId,
                                 String taskName,
                                 UserDto taskCreatedByUser,
                                 Long taskCommentId,
                                 String message,
                                 LocalDateTime createdAt,
                                 UserDto commentCreatedByUser) {
}
