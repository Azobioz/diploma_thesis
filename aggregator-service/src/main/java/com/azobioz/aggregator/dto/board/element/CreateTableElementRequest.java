package com.azobioz.aggregator.dto.board.element;

public record CreateTableElementRequest(int x,
                                        int y,
                                        int z,
                                        int width,
                                        int height,
                                        String color,
                                        int rows,
                                        int columns) {
}
