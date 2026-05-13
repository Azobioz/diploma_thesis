package com.azobioz.task.dto;

import java.time.LocalDateTime;
import java.util.List;

public record TaskDto(Long taskId,
                      String taskName,
                      String taskDescription,
                      Boolean isTaskCompleted,
                      LocalDateTime deadline,
                      Long createdByUserId,
                      List<TaskFileDto> attachedFiles
) { }
