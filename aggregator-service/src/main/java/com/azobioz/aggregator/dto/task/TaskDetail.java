package com.azobioz.aggregator.dto.task;

import java.time.LocalDateTime;
import java.util.List;

public record TaskDetail(
        Long taskId,
        String taskName,
        String taskDescription,
        LocalDateTime deadline,
        Boolean isTaskCompleted,
        List<Long> usersWhichDoingTaskIds,
        List<TaskCommentDto> taskComments,
        Long createdByUserId,
        List<TaskFileDto> attachedFiles
) {
}
