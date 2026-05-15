package com.azobioz.aggregator.dto.page;

import com.azobioz.aggregator.dto.task.FullTaskCommentDto;
import com.azobioz.aggregator.dto.task.TaskFileDto;
import com.azobioz.aggregator.dto.user.UserAvatarDto;

import java.time.LocalDateTime;
import java.util.List;

public record TaskMiniPageDto (
        Long taskId,
        String taskName,
        String taskDescription,
        LocalDateTime deadline,
        Boolean isTaskCompleted,
        List<UserAvatarDto> assignees,
        List<FullTaskCommentDto> taskComments,
        List<TaskFileDto> attachedFiles,
        Long createdByUserId
){}
