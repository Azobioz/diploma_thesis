package com.azobioz.board.dto;

import java.util.List;

public record BoardRequest(String boardName, List<Long> addedUsersInBoardIds) {}
