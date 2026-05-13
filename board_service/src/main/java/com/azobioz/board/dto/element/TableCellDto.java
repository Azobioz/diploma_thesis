package com.azobioz.board.dto.element;

public record TableCellDto(Long id,
                           int row,
                           int col,
                           String content) {
}
