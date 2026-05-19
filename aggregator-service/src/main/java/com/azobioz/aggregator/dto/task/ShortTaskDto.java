package com.azobioz.aggregator.dto.task;

import java.time.LocalDateTime;

public record ShortTaskDto(Long taskId,
                           String taskName,
                           LocalDateTime deadline,
                           Boolean isTaskCompleted,
                           Long taskCreatedByUserId) {
}
