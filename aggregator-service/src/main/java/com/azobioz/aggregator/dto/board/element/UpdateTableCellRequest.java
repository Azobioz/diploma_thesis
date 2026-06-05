package com.azobioz.aggregator.dto.board.element;

public record UpdateTableCellRequest(int row,
                                     int col,
                                     String content,
                                     Integer fontSize,
                                     String fontFamily,
                                     Boolean isBold,
                                     Boolean isUnderline) {
}
