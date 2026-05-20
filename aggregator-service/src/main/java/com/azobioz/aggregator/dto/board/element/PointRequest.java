package com.azobioz.aggregator.dto.board.element;

public record PointRequest(
        int x,
        int y,
        Integer orderIndex // Order index for point sequence (optional)
) { }
