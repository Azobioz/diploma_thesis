package com.azobioz.aggregator.dto.board.element;

public record CreateTextElementRequest(
        int x,
        int y,
        int z,
        int width,
        int height,
        String color,
        String content,
        int fontSize,
        String fontFamily
) { }
