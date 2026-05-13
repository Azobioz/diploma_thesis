package com.azobioz.board.dto.element;

public record CreateImageElementRequest(
        int x,
        int y,
        int z,
        int width,
        int height
) { }
