package com.azobioz.aggregator.dto.board.element;

public record CreateCommentElementRequest(
        int x,
        int y,
        int z,
        int width,
        int height,
        String message
) {
}
