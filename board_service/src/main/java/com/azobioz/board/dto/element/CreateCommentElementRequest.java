package com.azobioz.board.dto.element;

public record CreateCommentElementRequest(
        int x,
        int y,
        int z,
        int width,
        int height,
        String message
) {
}
