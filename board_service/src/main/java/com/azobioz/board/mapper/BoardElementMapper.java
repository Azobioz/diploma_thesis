package com.azobioz.board.mapper;

import com.azobioz.board.dto.element.BoardElementDto;
import com.azobioz.board.dto.element.TableCellDto;
import com.azobioz.board.model.*;

import java.util.List;
import java.util.Map;

import static com.azobioz.board.model.Element.*;

public class BoardElementMapper {

    public static BoardElementDto mapToBoardElementDto(BoardElement boardElement) {
        Map<String, Object> elementData = switch (boardElement.getType()) {
            case SHAPE -> {
                ShapeElement shape = boardElement.getShapeElement();
                yield Map.of(
                        "shapeType", shape.getShapeType().name(),
                        "borderColor", shape.getBorderColor() != null ? shape.getBorderColor() : "#000000",
                        "fillColor", shape.getFillColor() != null ? shape.getFillColor() : "#ffffff",
                        "text", shape.getText() != null ? shape.getText() : "",
                        "fontSize", shape.getFontSize() != null ? shape.getFontSize() : 12,
                        "fontFamily", shape.getFontFamily() != null ? shape.getFontFamily() : "Noto Sans",
                        "isBold", shape.getIsBold() != null ? shape.getIsBold() : false,
                        "isUnderline", shape.getIsUnderline() != null ? shape.getIsUnderline() : false,
                        "borderWidth", shape.getBorderWidth() != null ? shape.getBorderWidth() : 1
                );
            }
            case ARROW -> {
                ArrowElement arrow = boardElement.getArrowElement();
                yield Map.of(
                        "startX", arrow.getStartX(),
                        "startY", arrow.getStartY(),
                        "endX", arrow.getEndX(),
                        "endY", arrow.getEndY()
                );
            }
            case TEXT -> {
                TextElement text = boardElement.getTextElement();
                yield Map.of(
                        "content", text.getContent(),
                        "fontSize", text.getFontSize(),
                        "fontFamily", text.getFontFamily() != null ? text.getFontFamily() : "Arial",
                        "isBold", text.getIsBold() != null ? text.getIsBold() : false,
                        "isUnderline", text.getIsUnderline() != null ? text.getIsUnderline() : false
                );
            }
            case TABLE -> {
                TableElement table = boardElement.getTableElement();
                List<TableCellDto> cells = table.getTableCells().stream()
                        .map(cell -> new TableCellDto(
                                cell.getId(),
                                cell.getRow(),
                                cell.getCol(),
                                cell.getContent() != null ? cell.getContent() : ""
                        ))
                        .toList();
                yield Map.of(
                        "tableId", table.getId(),
                        "rows", table.getRows(),
                        "columns", table.getColumns(),
                        "cells", cells
                );
            }
            case IMAGE -> {
                ImageElement image = boardElement.getImageElement();
                String base64Image = null;
                if (image.getImage() != null && image.getImage().length > 0) {
                    base64Image = java.util.Base64.getEncoder().encodeToString(image.getImage());
                }
                yield Map.of(
                        "hasImage", image.getImage() != null && image.getImage().length > 0,
                        "imageSize", image.getImage() != null ? image.getImage().length : 0,
                        "imageData", base64Image != null ? base64Image : ""
                );
            }
            case DRAWING -> {
                DrawingElement drawing = boardElement.getDrawingElement();
                yield Map.of(
                        "pointsData", drawing.getPointsData() != null ? drawing.getPointsData() : "[]",
                        "color", drawing.getColor() != null ? drawing.getColor() : "#000000",
                        "strokeWidth", drawing.getStrokeWidth() != null ? drawing.getStrokeWidth() : 3
                );
            }
            case COMMENT -> {
                CommentElement comment = boardElement.getCommentElement();
                List<Map<String, Object>> repliesList = List.of();
                if (comment.getComments() != null) {
                    repliesList = comment.getComments().stream()
                            .map(reply -> Map.<String, Object>of(
                                    "id", reply.getId(),
                                    "message", reply.getMessage() != null ? reply.getMessage() : "",
                                    "userId", reply.getUserId(),
                                    "createdAt", reply.getCreatedAt()
                            ))
                            .toList();
                }
                yield Map.of(
                        "message", comment.getMessage() != null ? comment.getMessage() : "",
                        "userId", comment.getUserId(),
                        "createdAt", comment.getCreatedAt(),
                        "replies", repliesList
                );
            }
            default -> Map.of();
        };

        return new BoardElementDto(
                boardElement.getId(),
                boardElement.getType().name(),
                boardElement.getX(),
                boardElement.getY(),
                boardElement.getZ(),
                boardElement.getWidth(),
                boardElement.getHeight(),
                boardElement.getColor(),
                elementData
        );
    }
}
