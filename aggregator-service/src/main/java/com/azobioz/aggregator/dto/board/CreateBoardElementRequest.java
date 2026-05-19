package com.azobioz.aggregator.dto.board;

public record CreateBoardElementRequest(
        String type,
        Double x,
        Double y,
        Double width,
        Double height,
        Integer z
) {}