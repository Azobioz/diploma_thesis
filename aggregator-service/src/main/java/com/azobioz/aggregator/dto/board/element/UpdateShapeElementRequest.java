package com.azobioz.aggregator.dto.board.element;

public record UpdateShapeElementRequest(Integer x,
                                        Integer y,
                                        Integer z,
                                        Integer width,
                                        Integer height,
                                        String color,
                                        String borderColor,
                                        String fillColor,
                                        String text,
                                        String shapeType) {
}
