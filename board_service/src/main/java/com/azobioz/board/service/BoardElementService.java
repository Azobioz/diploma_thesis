package com.azobioz.board.service;

import com.azobioz.board.dto.element.*;
import com.azobioz.board.mapper.BoardElementMapper;
import com.azobioz.board.model.*;
import com.azobioz.board.repository.BoardElementRepository;
import com.azobioz.board.repository.BoardRepository;
import com.azobioz.board.repository.TableCellRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoardElementService {
    private final BoardElementRepository boardElementRepository;
    private final BoardRepository boardRepository;
    private final TableCellRepository tableCellRepository;
    private final ObjectMapper objectMapper;


    // ================== Post ===============================

    @Transactional
    public BoardElementDto createShapeElement(Long boardId, CreateShapeElementRequest request) {

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found with boardId: " + boardId));

        // 1. Создаём базовый элемент BoardElement
        BoardElement boardElement = new BoardElement();
        boardElement.setType(Element.SHAPE);
        boardElement.setX(request.x());
        boardElement.setY(request.y());
        boardElement.setZ(request.z());
        boardElement.setWidth(request.width());
        boardElement.setHeight(request.height());
        boardElement.setColor(request.color());
        boardElement.setBoard(board);

        boardElement = boardElementRepository.save(boardElement);

        // 2. Создаём конкретную фигуру ShapeElement
        ShapeElement shapeElement = new ShapeElement();
        shapeElement.setShapeType(Shape.valueOf(request.shapeType().toUpperCase()));
        shapeElement.setBorderColor(request.borderColor());
        shapeElement.setFillColor(request.fillColor());
        shapeElement.setText(request.text() != null ? request.text() : "");
        shapeElement.setBoardElement(boardElement);

        // Связываем обратно (важно для двунаправленной связи)
        boardElement.setShapeElement(shapeElement);

        // Сохраняем (CascadeType.ALL должен обработать сохранение ShapeElement)
        boardElementRepository.save(boardElement);

        // 3. Формируем специфические данные для фронтенда
        Map<String, Object> shapeData = new HashMap<>();
        shapeData.put("shapeType", shapeElement.getShapeType().name());
        shapeData.put("borderColor", shapeElement.getBorderColor() != null ? shapeElement.getBorderColor() : "#000000");
        shapeData.put("fillColor", shapeElement.getFillColor() != null ? shapeElement.getFillColor() : "#ffffff");
        shapeData.put("text", shapeElement.getText() != null ? shapeElement.getText() : "");

        // Возвращаем DTO в едином формате
        return new BoardElementDto(
                boardElement.getId(),
                boardElement.getType().name(),
                boardElement.getX(),
                boardElement.getY(),
                boardElement.getZ(),
                boardElement.getWidth(),
                boardElement.getHeight(),
                boardElement.getColor(),
                shapeData
        );
    }

    @Transactional
    public BoardElementDto createArrowElement(Long boardId, CreateArrowElementRequest request) {

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found with boardId: " + boardId));

        // 1. Создаём базовый элемент BoardElement
        BoardElement boardElement = new BoardElement();
        boardElement.setType(Element.ARROW);
        boardElement.setX(request.x());
        boardElement.setY(request.y());
        boardElement.setZ(request.z());
        boardElement.setWidth(request.width());
        boardElement.setHeight(request.height());
        boardElement.setColor(request.color());
        boardElement.setBoard(board);

        boardElement = boardElementRepository.save(boardElement);

        // 2. Создаём конкретный ArrowElement
        ArrowElement arrowElement = new ArrowElement();
        arrowElement.setStartX(request.startX());
        arrowElement.setStartY(request.startY());
        arrowElement.setEndX(request.endX());
        arrowElement.setEndY(request.endY());
        arrowElement.setBoardElement(boardElement);

        // Связываем обратно (двунаправленная связь)
        boardElement.setArrowElement(arrowElement);

        // Сохраняем (CascadeType.ALL должен обработать ArrowElement)
        boardElementRepository.save(boardElement);

        Map<String, Object> arrowData = new HashMap<>();
        arrowData.put("startX", arrowElement.getStartX());
        arrowData.put("startY", arrowElement.getStartY());
        arrowData.put("endX",   arrowElement.getEndX());
        arrowData.put("endY",   arrowElement.getEndY());

        // Возвращаем DTO в едином формате
        return new BoardElementDto(
                boardElement.getId(),
                boardElement.getType().name(),
                boardElement.getX(),
                boardElement.getY(),
                boardElement.getZ(),
                boardElement.getWidth(),
                boardElement.getHeight(),
                boardElement.getColor(),
                arrowData
        );
    }

    @Transactional
    public BoardElementDto createTextElement(Long boardId, CreateTextElementRequest request) {

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found with boardId: " + boardId));

        // 1. Создаём базовый элемент BoardElement
        BoardElement boardElement = new BoardElement();
        boardElement.setType(Element.TEXT);
        boardElement.setX(request.x());
        boardElement.setY(request.y());
        boardElement.setZ(request.z());
        boardElement.setWidth(request.width());
        boardElement.setHeight(request.height());
        boardElement.setColor(request.color());
        boardElement.setBoard(board);

        boardElement = boardElementRepository.save(boardElement);

        // 2. Создаём конкретный TextElement
        TextElement textElement = new TextElement();
        textElement.setContent(request.content());
        textElement.setFontSize(request.fontSize());
        textElement.setFontFamily(request.fontFamily());
        textElement.setColor(request.color());
        textElement.setBoardElement(boardElement);

        // Связываем обратно
        boardElement.setTextElement(textElement);

        // Сохраняем (благодаря CascadeType.ALL)
        boardElementRepository.save(boardElement);

        Map<String, Object> textData = new HashMap<>();
        textData.put("content", textElement.getContent());
        textData.put("fontSize", textElement.getFontSize());
        textData.put("fontFamily", textElement.getFontFamily() != null ? textElement.getFontFamily() : "Arial");
        textData.put("isBold", textElement.getIsBold() != null ? textElement.getIsBold() : false);
        textData.put("isUnderline", textElement.getIsUnderline() != null ? textElement.getIsUnderline() : false);

        // Возвращаем DTO элемента
        return new BoardElementDto(
                boardElement.getId(),
                boardElement.getType().name(),
                boardElement.getX(),
                boardElement.getY(),
                boardElement.getZ(),
                boardElement.getWidth(),
                boardElement.getHeight(),
                boardElement.getColor(),
                textData

        );
    }

    @Transactional
    public BoardElementDto createImageElement(Long boardId, MultipartFile file,
                                              CreateImageElementRequest request) {

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found with boardId: " + boardId));

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Image file is empty");
        }

        try {
            // 1. Создаём базовый BoardElement
            BoardElement boardElement = new BoardElement();
            boardElement.setType(Element.IMAGE);
            boardElement.setX(request.x());
            boardElement.setY(request.y());
            boardElement.setZ(request.z());
            boardElement.setWidth(request.width());
            boardElement.setHeight(request.height());
            boardElement.setColor(null);
            boardElement.setBoard(board);

            boardElement = boardElementRepository.save(boardElement);

            // 2. Создаём ImageElement
            ImageElement imageElement = new ImageElement();
            imageElement.setImage(file.getBytes());           // сохраняем байты изображения
            imageElement.setBoardElement(boardElement);

            // Связываем обратно
            boardElement.setImageElement(imageElement);

            // Сохраняем
            boardElementRepository.save(boardElement);

            // Convert image to base64 for immediate response
            String base64Image = java.util.Base64.getEncoder().encodeToString(file.getBytes());

            Map<String, Object> imageData = Map.of(
                    "hasImage", true,
                    "imageSize", file.getSize(),
                    "imageData", base64Image
            );

            return new BoardElementDto(
                    boardElement.getId(),
                    boardElement.getType().name(),
                    boardElement.getX(),
                    boardElement.getY(),
                    boardElement.getZ(),
                    boardElement.getWidth(),
                    boardElement.getHeight(),
                    boardElement.getColor(),
                    imageData
            );

        } catch (IOException e) {
            throw new RuntimeException("Failed to process image file", e);
        }
    }

    @Transactional
    public BoardElementDto createTableElement(Long boardId, CreateTableElementRequest request) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found with boardId: " + boardId));

        // 1. Базовый элемент
        BoardElement boardElement = new BoardElement();
        boardElement.setType(Element.TABLE);
        boardElement.setX(request.x());
        boardElement.setY(request.y());
        boardElement.setZ(request.z());
        boardElement.setWidth(request.width());
        boardElement.setHeight(request.height());
        boardElement.setColor(request.color());
        boardElement.setBoard(board);
        boardElementRepository.save(boardElement);

        // 2. Специфика таблицы
        TableElement tableElement = new TableElement();
        tableElement.setRows(request.rows());
        tableElement.setColumns(request.columns());
        tableElement.setBoardElement(boardElement);

        // 3. Генерация ячеек
        List<TableCell> cells = new ArrayList<>();
        for (int r = 0; r < request.rows(); r++) {
            for (int c = 0; c < request.columns(); c++) {
                TableCell cell = new TableCell();
                cell.setRow(r);
                cell.setCol(c);
                cell.setContent(""); // пустая ячейка по умолчанию
                cell.setTableElement(tableElement); //Новая связь
                cells.add(cell);
            }
        }
        tableElement.setTableCells(cells);
        boardElement.setTableElement(tableElement);

        // 4. Сохранение (CascadeType.ALL автоматически сохранит TableElement и все TableCell)
        boardElementRepository.save(boardElement);

        // 5. Формируем DTO (не отдаём все ячейки во фронтенд при создании, только метаданные)
        Map<String, Object> tableData = Map.of(
                "rows", tableElement.getRows(),
                "columns", tableElement.getColumns(),
                "totalCells", cells.size()
        );

        return new BoardElementDto(
                boardElement.getId(),
                boardElement.getType().name(),
                boardElement.getX(),
                boardElement.getY(),
                boardElement.getZ(),
                boardElement.getWidth(),
                boardElement.getHeight(),
                boardElement.getColor(),
                tableData
        );
    }

    @Transactional
    public BoardElementDto createDrawingElement(Long boardId, CreateDrawingElementRequest request) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found with boardId: " + boardId));

        // 1. Создаём базовый элемент
        BoardElement boardElement = new BoardElement();
        boardElement.setType(Element.DRAWING);
        boardElement.setX(request.x());
        boardElement.setY(request.y());
        boardElement.setZ(request.z());
        boardElement.setWidth(request.width());
        boardElement.setHeight(request.height());
        boardElement.setColor(request.color());
        boardElement.setBoard(board);
        boardElement = boardElementRepository.save(boardElement);

        // 2. Создаём специфику рисования
        String pointsJson;
        try {
            pointsJson = request.points() != null ? objectMapper.writeValueAsString(request.points()) : "[]";
        } catch (JsonProcessingException e) {
            pointsJson = "[]";
        }

        DrawingElement drawingElement = new DrawingElement();
        drawingElement.setColor(request.color());
        drawingElement.setStrokeWidth(request.strokeWidth());
        drawingElement.setPointsData(pointsJson);
        drawingElement.setBoardElement(boardElement);

        // Двунаправленная связь
        boardElement.setDrawingElement(drawingElement);

        // Сохраняем всё дерево
        boardElementRepository.save(boardElement);

        Map<String, Object> drawingData = Map.of(
                "pointsData", drawingElement.getPointsData() != null ? drawingElement.getPointsData() : "[]",
                "color", drawingElement.getColor() != null ? drawingElement.getColor() : "#000000",
                "strokeWidth", drawingElement.getStrokeWidth() != null ? drawingElement.getStrokeWidth() : 3
        );

        return new BoardElementDto(
                boardElement.getId(),
                boardElement.getType().name(),
                boardElement.getX(),
                boardElement.getY(),
                boardElement.getZ(),
                boardElement.getWidth(),
                boardElement.getHeight(),
                boardElement.getColor(),
                drawingData
        );
    }

    @Transactional
    public BoardElementDto createCommentElement(Long boardId, CreateCommentElementRequest request, Long userId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found with boardId: " + boardId));

        // 1. Базовый элемент
        BoardElement boardElement = new BoardElement();
        boardElement.setType(Element.COMMENT);
        boardElement.setX(request.x());
        boardElement.setY(request.y());
        boardElement.setZ(request.z());
        boardElement.setWidth(request.width());
        boardElement.setHeight(request.height());
        boardElement.setBoard(board);
        boardElementRepository.save(boardElement);

        // 2. Специфика комментария
        CommentElement commentElement = new CommentElement();
        commentElement.setMessage(request.message());
        commentElement.setUserId(userId);
        commentElement.setCreatedAt(LocalDateTime.now());
        commentElement.setBoardElement(boardElement);

        // Инициализируем список ответов, чтобы избежать NPE
        commentElement.setComments(new ArrayList<>());

        // Двунаправленная связь
        boardElement.setCommentElement(commentElement);
        boardElementRepository.save(boardElement); // Cascade сохранит CommentElement

        Map<String, Object> commentData = Map.of(
                "message", commentElement.getMessage(),
                "userId", commentElement.getUserId(),
                "createdAt", commentElement.getCreatedAt(),
                "replies", List.of()
        );

        return new BoardElementDto(
                boardElement.getId(),
                boardElement.getType().name(),
                boardElement.getX(),
                boardElement.getY(),
                boardElement.getZ(),
                boardElement.getWidth(),
                boardElement.getHeight(),
                null,
                commentData
        );
    }

    @Transactional
    public CommentReplyDto addCommentReply(Long boardId, Long commentElementId, AddCommentReplyRequest request, Long userId) {
        // Находим элемент и проверяем, что это комментарий
        BoardElement boardElement = boardElementRepository.findById(commentElementId)
                .orElseThrow(() -> new RuntimeException("Comment element not found with boardId: " + commentElementId));

        if (boardElement.getType() != Element.COMMENT) {
            throw new RuntimeException("Element with boardId " + commentElementId + " is not a comment");
        }
        if (!boardElement.getBoard().getId().equals(boardId)) {
            throw new RuntimeException("Comment does not belong to board " + boardId);
        }

        CommentElement commentElement = boardElement.getCommentElement();

        // Создаём ответ
        CommentReplies reply = new CommentReplies();
        reply.setMessage(request.message());
        reply.setUserId(userId);
        reply.setCreatedAt(LocalDateTime.now());
        reply.setCommentElement(commentElement);

        // Добавляем в коллекцию и сохраняем через каскад
        if (commentElement.getComments() == null) {
            commentElement.setComments(new ArrayList<>());
        }
        commentElement.getComments().add(reply);
        boardElementRepository.save(boardElement);

        return new CommentReplyDto(
                reply.getId(),
                reply.getMessage(),
                reply.getUserId(),
                reply.getCreatedAt()
        );
    }

    // ================== Put ===============================

    @Transactional
    public BoardElementDto updateShapeElement(Long boardId, Long elementId, UpdateShapeElementRequest request) {
        // Проверяем существование доски
        boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found with boardId: " + boardId));

        // Находим элемент
        BoardElement boardElement = boardElementRepository.findById(elementId)
                .orElseThrow(() -> new RuntimeException("BoardElement not found with boardId: " + elementId));

        // Проверяем, что это фигура
        if (boardElement.getType() != Element.SHAPE) {
            throw new RuntimeException("Element with boardId " + elementId + " is not a shape");
        }

        // Проверяем, что элемент принадлежит доске
        if (!boardElement.getBoard().getId().equals(boardId)) {
            throw new RuntimeException("Element does not belong to board with boardId " + boardId);
        }

        ShapeElement shapeElement = boardElement.getShapeElement();

        // Обновляем базовые параметры (только если переданы)
        if (request.x() != null) boardElement.setX(request.x());
        if (request.y() != null) boardElement.setY(request.y());
        if (request.z() != null) boardElement.setZ(request.z());
        if (request.width() != null) boardElement.setWidth(request.width());
        if (request.height() != null) boardElement.setHeight(request.height());
        if (request.color() != null) boardElement.setColor(request.color());

        // Обновляем специфичные параметры фигуры
        if (request.borderColor() != null) {
            shapeElement.setBorderColor(request.borderColor());
        }
        if (request.fillColor() != null) {
            shapeElement.setFillColor(request.fillColor());
        }
        if (request.text() != null) {
            shapeElement.setText(request.text());
        }
        if (request.fontSize() != null) {
            shapeElement.setFontSize(request.fontSize());
        }
        if (request.fontFamily() != null) {
            shapeElement.setFontFamily(request.fontFamily());
        }
        if (request.isBold() != null) {
            shapeElement.setIsBold(request.isBold());
        }
        if (request.isUnderline() != null) {
            shapeElement.setIsUnderline(request.isUnderline());
        }
        if (request.borderWidth() != null) {
            shapeElement.setBorderWidth(request.borderWidth());
        }

        // Save boardElement - cascade will persist shapeElement changes
        boardElementRepository.save(boardElement);
        
        // Log for debugging
        System.out.println("Updated shape element - fontSize: " + shapeElement.getFontSize() + 
                          ", fontFamily: " + shapeElement.getFontFamily() + 
                          ", isBold: " + shapeElement.getIsBold() + 
                          ", isUnderline: " + shapeElement.getIsUnderline());

        // Формируем ответ
        Map<String, Object> shapeData = new HashMap<>();
        shapeData.put("shapeType", shapeElement.getShapeType() != null ? shapeElement.getShapeType().name() : null);
        shapeData.put("borderColor", shapeElement.getBorderColor() != null ? shapeElement.getBorderColor() : "#000000");
        shapeData.put("fillColor", shapeElement.getFillColor() != null ? shapeElement.getFillColor() : "#ffffff");
        shapeData.put("text", shapeElement.getText() != null ? shapeElement.getText() : "");
        shapeData.put("fontSize", shapeElement.getFontSize() != null ? shapeElement.getFontSize() : 12);
        shapeData.put("fontFamily", shapeElement.getFontFamily() != null ? shapeElement.getFontFamily() : "Noto Sans");
        shapeData.put("isBold", shapeElement.getIsBold() != null ? shapeElement.getIsBold() : false);
        shapeData.put("isUnderline", shapeElement.getIsUnderline() != null ? shapeElement.getIsUnderline() : false);
        shapeData.put("borderWidth", shapeElement.getBorderWidth() != null ? shapeElement.getBorderWidth() : 1);

        return new BoardElementDto(
                boardElement.getId(),
                boardElement.getType().name(),
                boardElement.getX(),
                boardElement.getY(),
                boardElement.getZ(),
                boardElement.getWidth(),
                boardElement.getHeight(),
                boardElement.getColor(),
                shapeData
        );
    }

    @Transactional
    public BoardElementDto updateArrowElement(Long boardId, Long elementId, UpdateArrowElementRequest request) {
        // Проверяем существование доски
        boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found with boardId: " + boardId));

        // Находим элемент
        BoardElement boardElement = boardElementRepository.findById(elementId)
                .orElseThrow(() -> new RuntimeException("BoardElement not found with boardId: " + elementId));

        // Проверяем, что это стрелка
        if (boardElement.getType() != Element.ARROW) {
            throw new RuntimeException("Element with boardId " + elementId + " is not an arrow");
        }

        // Проверяем, что элемент принадлежит доске
        if (!boardElement.getBoard().getId().equals(boardId)) {
            throw new RuntimeException("Element does not belong to board with boardId " + boardId);
        }

        ArrowElement arrowElement = boardElement.getArrowElement();

        // Обновляем базовые параметры
        if (request.x() != null) boardElement.setX(request.x());
        if (request.y() != null) boardElement.setY(request.y());
        if (request.z() != null) boardElement.setZ(request.z());
        if (request.width() != null) boardElement.setWidth(request.width());
        if (request.height() != null) boardElement.setHeight(request.height());
        if (request.color() != null) boardElement.setColor(request.color());

        // Обновляем специфичные параметры стрелки
        if (request.startX() != null) arrowElement.setStartX(request.startX());
        if (request.startY() != null) arrowElement.setStartY(request.startY());
        if (request.endX() != null) arrowElement.setEndX(request.endX());
        if (request.endY() != null) arrowElement.setEndY(request.endY());

        boardElementRepository.save(boardElement);

        // Формируем ответ
        Map<String, Object> arrowData = new HashMap<>();
        arrowData.put("startX", arrowElement.getStartX());
        arrowData.put("startY", arrowElement.getStartY());
        arrowData.put("endX", arrowElement.getEndX());
        arrowData.put("endY", arrowElement.getEndY());

        return new BoardElementDto(
                boardElement.getId(),
                boardElement.getType().name(),
                boardElement.getX(),
                boardElement.getY(),
                boardElement.getZ(),
                boardElement.getWidth(),
                boardElement.getHeight(),
                boardElement.getColor(),
                arrowData
        );
    }

    @Transactional
    public BoardElementDto updateTextElement(Long boardId, Long elementId, UpdateTextElementRequest request) {
        // Проверяем существование доски
        boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found with boardId: " + boardId));

        // Находим элемент
        BoardElement boardElement = boardElementRepository.findById(elementId)
                .orElseThrow(() -> new RuntimeException("BoardElement not found with boardId: " + elementId));

        // Проверяем, что это текст
        if (boardElement.getType() != Element.TEXT) {
            throw new RuntimeException("Element with boardId " + elementId + " is not a text");
        }

        // Проверяем, что элемент принадлежит доске
        if (!boardElement.getBoard().getId().equals(boardId)) {
            throw new RuntimeException("Element does not belong to board with boardId " + boardId);
        }

        TextElement textElement = boardElement.getTextElement();

        // Обновляем базовые параметры
        if (request.x() != null) boardElement.setX(request.x());
        if (request.y() != null) boardElement.setY(request.y());
        if (request.z() != null) boardElement.setZ(request.z());
        if (request.width() != null) boardElement.setWidth(request.width());
        if (request.height() != null) boardElement.setHeight(request.height());
        if (request.color() != null) boardElement.setColor(request.color());

        // Обновляем специфичные параметры текста
        if (request.content() != null) {
            textElement.setContent(request.content());
        }
        if (request.fontSize() != null) {
            textElement.setFontSize(request.fontSize());
        }
        if (request.fontFamily() != null) {
            textElement.setFontFamily(request.fontFamily());
        }
        if (request.color() != null) {
            textElement.setColor(request.color());
        }
        if (request.isBold() != null) {
            textElement.setIsBold(request.isBold());
        }
        if (request.isUnderline() != null) {
            textElement.setIsUnderline(request.isUnderline());
        }

        boardElementRepository.save(boardElement);

        // Формируем ответ
        Map<String, Object> textData = new HashMap<>();
        textData.put("content", textElement.getContent());
        textData.put("fontSize", textElement.getFontSize());
        textData.put("fontFamily", textElement.getFontFamily() != null ? textElement.getFontFamily() : "Arial");
        textData.put("isBold", textElement.getIsBold() != null ? textElement.getIsBold() : false);
        textData.put("isUnderline", textElement.getIsUnderline() != null ? textElement.getIsUnderline() : false);

        return new BoardElementDto(
                boardElement.getId(),
                boardElement.getType().name(),
                boardElement.getX(),
                boardElement.getY(),
                boardElement.getZ(),
                boardElement.getWidth(),
                boardElement.getHeight(),
                boardElement.getColor(),
                textData
        );
    }

    @Transactional
    public BoardElementDto updateDrawingElement(Long boardId, Long elementId, UpdateDrawingElementRequest request) {
        // Проверяем существование доски
        boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found with boardId: " + boardId));

        // Находим элемент
        BoardElement boardElement = boardElementRepository.findById(elementId)
                .orElseThrow(() -> new RuntimeException("BoardElement not found with boardId: " + elementId));

        // Проверяем, что это рисунок
        if (boardElement.getType() != Element.DRAWING) {
            throw new RuntimeException("Element with boardId " + elementId + " is not a drawing");
        }

        // Проверяем, что элемент принадлежит доске
        if (!boardElement.getBoard().getId().equals(boardId)) {
            throw new RuntimeException("Element does not belong to board with boardId " + boardId);
        }

        DrawingElement drawingElement = boardElement.getDrawingElement();

        // Обновляем базовые параметры
        if (request.x() != null) boardElement.setX(request.x());
        if (request.y() != null) boardElement.setY(request.y());
        if (request.z() != null) boardElement.setZ(request.z());
        if (request.width() != null) boardElement.setWidth(request.width());
        if (request.height() != null) boardElement.setHeight(request.height());
        if (request.color() != null) {
            boardElement.setColor(request.color());
            drawingElement.setColor(request.color());
        }
        if (request.strokeWidth() != null) {
            drawingElement.setStrokeWidth(request.strokeWidth());
        }
        if (request.points() != null) {
            try {
                drawingElement.setPointsData(objectMapper.writeValueAsString(request.points()));
            } catch (JsonProcessingException e) {
                drawingElement.setPointsData("[]");
            }
        }

        boardElementRepository.save(boardElement);

        // Формируем ответ
        Map<String, Object> drawingData = Map.of(
                "pointsData", drawingElement.getPointsData() != null ? drawingElement.getPointsData() : "[]",
                "color", drawingElement.getColor() != null ? drawingElement.getColor() : "#000000",
                "strokeWidth", drawingElement.getStrokeWidth() != null ? drawingElement.getStrokeWidth() : 3
        );

        return new BoardElementDto(
                boardElement.getId(),
                boardElement.getType().name(),
                boardElement.getX(),
                boardElement.getY(),
                boardElement.getZ(),
                boardElement.getWidth(),
                boardElement.getHeight(),
                boardElement.getColor(),
                drawingData
        );
    }

    @Transactional
    public TableCellDto updateTableCell(Long boardId, Long tableElementId, UpdateTableCellRequest request) {
        // Проверяем существование доски
        boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found with boardId: " + boardId));

        // Находим TableElement
        BoardElement boardElement = boardElementRepository.findById(tableElementId)
                .orElseThrow(() -> new RuntimeException("BoardElement not found with boardId: " + tableElementId));

        // Проверяем, что это таблица
        if (boardElement.getType() != Element.TABLE) {
            throw new RuntimeException("Element with boardId " + tableElementId + " is not a table");
        }

        // Проверяем, что таблица принадлежит доске
        if (!boardElement.getBoard().getId().equals(boardId)) {
            throw new RuntimeException("Table does not belong to board with boardId " + boardId);
        }

        TableElement tableElement = boardElement.getTableElement();

        // Проверяем границы таблицы
        if (request.row() < 0 || request.row() >= tableElement.getRows()) {
            throw new RuntimeException("Row " + request.row() + " is out of bounds. Table has " + tableElement.getRows() + " rows");
        }

        if (request.col() < 0 || request.col() >= tableElement.getColumns()) {
            throw new RuntimeException("Column " + request.col() + " is out of bounds. Table has " + tableElement.getColumns() + " columns");
        }

        // Ищем существующую ячейку
        TableCell tableCell = tableElement.getTableCells().stream()
                .filter(cell -> cell.getRow() == request.row() && cell.getCol() == request.col())
                .findFirst()
                .orElse(null);

        // Если ячейка существует - обновляем, иначе создаём новую
        if (tableCell != null) {
            tableCell.setContent(request.content());
            // Сохраняем через tableCellRepository (если есть) или через tableElement
            tableCell = tableCellRepository.save(tableCell);
        } else {
            // Создаём новую ячейку (на случай, если она не была создана при создании таблицы)
            tableCell = new TableCell();
            tableCell.setRow(request.row());
            tableCell.setCol(request.col());
            tableCell.setContent(request.content());
            tableCell.setTableElement(tableElement);

            // Добавляем в список ячеек таблицы
            tableElement.getTableCells().add(tableCell);

            // Сохраняем
            tableCell = tableCellRepository.save(tableCell);
        }

        return new TableCellDto(
                tableCell.getId(),
                tableCell.getRow(),
                tableCell.getCol(),
                tableCell.getContent()
        );
    }

    // Универсальное обновление элемента (для изображений и других типов)
    @Transactional
    public BoardElementDto updateElement(Long boardId, Long elementId, UpdateElementRequest request) {
        System.out.println("=== updateElement called ===");
        System.out.println("Board ID: " + boardId);
        System.out.println("Element ID: " + elementId);
        System.out.println("Request data: x=" + request.x() + ", y=" + request.y() + 
                          ", width=" + request.width() + ", height=" + request.height());
        
        // Проверяем существование доски
        boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found with boardId: " + boardId));

        // Находим элемент
        BoardElement boardElement = boardElementRepository.findById(elementId)
                .orElseThrow(() -> new RuntimeException("BoardElement not found with boardId: " + elementId));

        System.out.println("Element before update: x=" + boardElement.getX() + ", y=" + boardElement.getY() + 
                          ", width=" + boardElement.getWidth() + ", height=" + boardElement.getHeight());

        // Проверяем, что элемент принадлежит доске
        if (!boardElement.getBoard().getId().equals(boardId)) {
            throw new RuntimeException("Element does not belong to board with boardId " + boardId);
        }

        // Обновляем базовые параметры
        if (request.x() != null) boardElement.setX(request.x());
        if (request.y() != null) boardElement.setY(request.y());
        if (request.z() != null) boardElement.setZ(request.z());
        if (request.width() != null) boardElement.setWidth(request.width());
        if (request.height() != null) boardElement.setHeight(request.height());
        if (request.color() != null) boardElement.setColor(request.color());

        System.out.println("Element after update: x=" + boardElement.getX() + ", y=" + boardElement.getY() + 
                          ", width=" + boardElement.getWidth() + ", height=" + boardElement.getHeight());

        boardElementRepository.save(boardElement);

        System.out.println("Element saved to database");

        // Используем маппер для формирования ответа
        return BoardElementMapper.mapToBoardElementDto(boardElement);
    }

    // ================== GET ===============================

    @Transactional(readOnly = true)
    public List<BoardElementDto> getAllElements(Long boardId) {
        List<BoardElement> elements = boardElementRepository.findAllByBoardId(boardId);

        return elements.stream()
                .map(BoardElementMapper::mapToBoardElementDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public BoardElementDto getTableElement(Long boardId, Long tableElementId) {
        // Проверяем существование доски
         boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found with boardId: " + boardId));

        // Находим BoardElement
        BoardElement boardElement = boardElementRepository.findById(tableElementId)
                .orElseThrow(() -> new RuntimeException("BoardElement not found with boardId: " + tableElementId));

        // Проверяем, что это таблица
        if (boardElement.getType() != Element.TABLE) {
            throw new RuntimeException("Element with boardId " + tableElementId + " is not a table");
        }

        // Проверяем, что таблица принадлежит доске
        if (!boardElement.getBoard().getId().equals(boardId)) {
            throw new RuntimeException("Table does not belong to board with boardId " + boardId);
        }

        TableElement tableElement = boardElement.getTableElement();

        // Получаем все ячейки таблицы
        List<TableCellDto> cells = tableElement.getTableCells().stream()
                .map(cell -> new TableCellDto(
                        cell.getId(),
                        cell.getRow(),
                        cell.getCol(),
                        cell.getContent() != null ? cell.getContent() : ""
                ))
                .toList();

        // Формируем специфические данные для фронтенда
        Map<String, Object> tableData = Map.of(
                "tableId", tableElement.getId(),
                "rows", tableElement.getRows(),
                "columns", tableElement.getColumns(),
                "cells", cells
        );

        // Возвращаем DTO элемента
        return new BoardElementDto(
                boardElement.getId(),
                boardElement.getType().name(),
                boardElement.getX(),
                boardElement.getY(),
                boardElement.getZ(),
                boardElement.getWidth(),
                boardElement.getHeight(),
                boardElement.getColor(),
                tableData
        );
    }

    // ================== DELETE ===============================

    @Transactional
    public String deleteElement(Long boardId, Long elementId) {
        // Проверяем существование доски
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found with boardId: " + boardId));

        // Находим элемент
        BoardElement boardElement = boardElementRepository.findById(elementId)
                .orElseThrow(() -> new RuntimeException("BoardElement not found with boardId: " + elementId));

        // Проверяем, что элемент принадлежит доске
        if (!boardElement.getBoard().getId().equals(boardId)) {
            throw new RuntimeException("Element does not belong to board with boardId " + boardId);
        }

        String elementType = boardElement.getType().name();
        boardElementRepository.delete(boardElement);

        return "Element " + elementType + " with boardId " + elementId + " was deleted from board " + boardId;
    }

}