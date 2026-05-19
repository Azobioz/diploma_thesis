package com.azobioz.aggregator.dto.board;

public record MoveElementRequest(
        Double newX,
        Double newY
) {}