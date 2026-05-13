package com.azobioz.aggregator.dto.board;

import java.util.List;

public record CreateBoardRequest(String boardName,
                                 List<Long> participantIds// ID пользователей, которых добавляем в доску)
){ }
