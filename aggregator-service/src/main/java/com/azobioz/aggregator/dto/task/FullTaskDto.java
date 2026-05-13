package com.azobioz.aggregator.dto.task;

import java.time.LocalDateTime;

public record FullTaskDto(Long taskId,
                      String taskName,
                      String taskDescription,
                      Boolean isTaskCompleted,
                      LocalDateTime deadline,
                      Long createdByUserId
) { }
