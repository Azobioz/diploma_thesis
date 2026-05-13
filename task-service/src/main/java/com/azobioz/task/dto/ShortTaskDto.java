package com.azobioz.task.dto;

import java.time.LocalDateTime;

public record ShortTaskDto (Long taskId,
                            String taskName,
                            LocalDateTime deadline,
                            Long taskCreatedByUserId
) { }
