package com.azobioz.aggregator.dto.page;

import com.azobioz.aggregator.dto.task.TaskListDto;
import com.azobioz.aggregator.dto.user.UserDto;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class TasksPageDto {
    private Long currentSpaceId;
    private Long creatorOfSpaceId;
    private String spaceName;
    private Long currentBoardId;
    private String currentBoardName;
    private UserDto currentUser;
    private List<TaskListDto> tasks;
}
