package com.azobioz.aggregator.dto.task;

import com.azobioz.aggregator.dto.user.UserDto;
import com.azobioz.aggregator.dto.user.UserInfoDto;

import java.time.LocalDateTime;
import java.util.List;

public record GetTaskAndUsersWhichDoingTaskAndCreatedByResponse(
        Long taskId,
        String taskName,
        String taskDescription,
        Boolean isTaskCompleted,
        LocalDateTime deadline,
        UserInfoDto taskCreatedByUser,
        List<UserDto> usersAssigneeToTask
) { }
