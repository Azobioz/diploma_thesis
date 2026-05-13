package com.azobioz.aggregator.dto.board;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BoardDto {
    private Long boardId;
    private String boardName;
    private Long boardCreatedByUserId;
    private Long spaceId;
}
