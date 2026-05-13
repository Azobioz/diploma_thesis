package com.azobioz.task.dto;

import java.time.LocalDateTime;

public record CreateTaskRequest(String taskName,
                                String taskDescription,
                                LocalDateTime deadline,
                                Long userId
) { }
