package com.azobioz.aggregator.dto.board;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SpaceDto {
    private Long spaceId;
    private String spaceName;
    private String spaceDescription;
    private Long spaceCreatedByUserId;
}
