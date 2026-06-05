package com.azobioz.aggregator.dto.board.element;

public record CreateArrowElementRequest(int startX,
                                        int startY,
                                        int endX,
                                        int endY,
                                        int x,
                                        int y,
                                        int z,
                                        int width,
                                        int height,
                                        String color,
                                        String arrowType,
                                        String strokeStyle) {
}
