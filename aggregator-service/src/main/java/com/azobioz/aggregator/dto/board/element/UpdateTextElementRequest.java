package com.azobioz.aggregator.dto.board.element;

public record UpdateTextElementRequest(Integer x,
                                       Integer y,
                                       Integer z,
                                       Integer width,
                                       Integer height,
                                       String color,
                                       String content,
                                       Integer fontSize,
                                       String fontFamily) {
}
