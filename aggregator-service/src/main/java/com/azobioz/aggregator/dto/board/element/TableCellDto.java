package com.azobioz.aggregator.dto.board.element;

public record TableCellDto(Long id,
                           int row,
                           int col,
                           String content,
                           Integer fontSize,
                           String fontFamily,
                           Boolean isBold,
                           Boolean isUnderline) {
}
