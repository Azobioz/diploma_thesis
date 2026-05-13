package com.azobioz.aggregator.dto.task;

import java.time.LocalDateTime;

public record CreateTaskRequest(String taskName,
                                String taskDescription,
                                LocalDateTime deadline,
                                Long userId
) { }
