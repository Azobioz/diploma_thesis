package com.azobioz.aggregator.dto.page;

import com.azobioz.aggregator.dto.board.BoardDto;
import com.azobioz.aggregator.dto.board.SpaceDto;
import com.azobioz.aggregator.dto.user.UserDto;
import com.azobioz.aggregator.dto.user.UserInfoDto;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class SpaceMainPageDto {

    private Long currentSpaceId;
    private String spaceName;
    private String spaceDescription;
    private UserDto currentUser;
    private List<UserDto> usersInCurrentSpace;
    private List<BoardDto> boardsInSpace;
    private List<SpaceDto> spacesCurrentUserParticipate;
    private UserInfoDto spaceCreator;
}

