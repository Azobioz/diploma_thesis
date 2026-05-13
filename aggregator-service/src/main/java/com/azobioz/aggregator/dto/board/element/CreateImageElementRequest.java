package com.azobioz.aggregator.dto.board.element;

public record CreateImageElementRequest(
        int x,
        int y,
        int z,
        int width,
        int height
) { }
