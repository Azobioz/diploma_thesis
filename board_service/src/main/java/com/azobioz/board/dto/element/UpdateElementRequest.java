package com.azobioz.board.dto.element;

public record UpdateElementRequest(Integer x,
                                   Integer y,
                                   Integer z,
                                   Integer width,
                                   Integer height,
                                   String color) {
}
