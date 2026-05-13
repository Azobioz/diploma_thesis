package com.azobioz.aggregator.dto.task;

import com.azobioz.aggregator.dto.user.UserInfoDto;

import java.time.LocalDateTime;

public record GetTaskAndUserWhichCreatedByResponse (Long taskId,
                                                    String taskName,
                                                    String taskDescription,
                                                    Boolean isTaskCompleted,
                                                    LocalDateTime deadline,
                                                    UserInfoDto createdByUser) {
}
