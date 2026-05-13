package com.azobioz.board.dto.element;

public record CreateShapeElementRequest(
        int x,
        int y,
        int z,
        int width,
        int height,
        String color,
        String borderColor,
        String fillColor,
        String text,
        String shapeType
) {}
