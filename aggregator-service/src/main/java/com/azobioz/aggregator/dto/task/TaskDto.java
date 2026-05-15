package com.azobioz.aggregator.dto.task;

import com.azobioz.aggregator.dto.user.UserAvatarDto;

import java.time.LocalDateTime;

public record TaskDto(Long taskId,
                      String taskName,
                      LocalDateTime deadline,
                      Boolean isTaskCompleted,
                      UserAvatarDto createByUserAvatar) {
}
