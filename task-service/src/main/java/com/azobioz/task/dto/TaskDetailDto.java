package com.azobioz.task.dto;

import java.time.LocalDateTime;
import java.util.List;

public record TaskDetailDto(
        Long taskId,
        String taskName,
        String taskDescription,
        LocalDateTime deadline,
        Boolean isTaskCompleted,
        List<Long> usersWhichDoingTaskIds,
        List<TaskCommentDto> taskComments,
        Long createdByUserId,
        List<TaskFileDto> attachedFiles
) { }
