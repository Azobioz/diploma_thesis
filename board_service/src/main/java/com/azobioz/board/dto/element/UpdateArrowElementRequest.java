package com.azobioz.board.dto.element;

public record UpdateArrowElementRequest(Integer startX,
                                        Integer startY,
                                        Integer endX,
                                        Integer endY,
                                        Integer x,
                                        Integer y,
                                        Integer z,
                                        Integer width,
                                        Integer height,
                                        String color,
                                        String arrowType,
                                        String strokeStyle
) { }
