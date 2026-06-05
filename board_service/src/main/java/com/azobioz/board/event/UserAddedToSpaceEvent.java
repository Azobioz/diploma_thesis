package com.azobioz.board.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserAddedToSpaceEvent {
    private Long spaceId;
    private String spaceName;
    private Long addedUserId;
    private String addedUserNickname;
    private Long spaceCreatorId;
}
