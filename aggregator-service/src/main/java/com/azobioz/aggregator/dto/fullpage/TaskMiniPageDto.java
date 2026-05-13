package com.azobioz.aggregator.dto.fullpage;

import com.azobioz.aggregator.dto.task.FullTaskCommentDto;
import com.azobioz.aggregator.dto.user.UserAvatarDto;

import java.time.LocalDateTime;
import java.util.List;

public record TaskMiniPageDto (Long taskId,
                                String taskName,
                                String taskDescription,
                                LocalDateTime deadline,
                                Boolean isTaskCompleted,
                                List<UserAvatarDto> usersWhichDoingTask,
                                List<FullTaskCommentDto> taskComments
){}
