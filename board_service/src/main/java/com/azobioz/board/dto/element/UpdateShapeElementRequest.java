package com.azobioz.board.dto.element;

public record UpdateShapeElementRequest(Integer x,
                                        Integer y,
                                        Integer z,
                                        Integer width,
                                        Integer height,
                                        String color,
                                        String borderColor,
                                        String fillColor,
                                        String text,
                                        Integer fontSize,
                                        String fontFamily,
                                        Boolean isBold,
                                        Boolean isUnderline,
                                        Integer borderWidth,
                                        String shapeType
) { }
