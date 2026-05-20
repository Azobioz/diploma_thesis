package com.azobioz.board.service;

import com.azobioz.board.dto.element.CreateDrawingElementRequest;
import com.azobioz.board.dto.element.DrawingElementResponseDto;
import com.azobioz.board.dto.element.UpdateDrawingElementRequest;
import com.azobioz.board.mapper.DrawingElementMapper;
import com.azobioz.board.model.Board;
import com.azobioz.board.model.BoardElement;
import com.azobioz.board.model.DrawingElement;
import com.azobioz.board.model.Element;
import com.azobioz.board.repository.BoardElementRepository;
import com.azobioz.board.repository.BoardRepository;
import com.azobioz.board.repository.DrawingElementRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DrawingElementService {

    private final DrawingElementRepository drawingElementRepository;
    private final BoardElementRepository boardElementRepository;
    private final BoardRepository boardRepository;
    private final DrawingElementMapper drawingElementMapper;
    private final ObjectMapper objectMapper;

    @Transactional
    public DrawingElementResponseDto createDrawing(Long boardId, CreateDrawingElementRequest request) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found"));

        BoardElement boardElement = new BoardElement();
        boardElement.setBoard(board);
        boardElement.setType(Element.DRAWING);
        boardElement.setX(request.x());
        boardElement.setY(request.y());
        boardElement.setZ(request.z());
        boardElement.setWidth(request.width());
        boardElement.setHeight(request.height());

        boardElementRepository.save(boardElement);

        String pointsJson;
        try {
            pointsJson = request.points() != null ? objectMapper.writeValueAsString(request.points()) : "[]";
        } catch (JsonProcessingException e) {
            pointsJson = "[]";
        }

        DrawingElement drawingElement = new DrawingElement();
        drawingElement.setBoardElement(boardElement);
        drawingElement.setColor(request.color());
        drawingElement.setStrokeWidth(request.strokeWidth());
        drawingElement.setPointsData(pointsJson);

        drawingElementRepository.save(drawingElement);

        return drawingElementMapper.toResponse(boardElement, drawingElement);
    }

    @Transactional
    public DrawingElementResponseDto updateDrawing(Long boardId, Long elementId, UpdateDrawingElementRequest request) {
        BoardElement boardElement = boardElementRepository.findById(elementId)
                .orElseThrow(() -> new RuntimeException("Element not found"));

        DrawingElement drawingElement = drawingElementRepository.findByBoardElementId(elementId);
        if (drawingElement == null) {
            throw new RuntimeException("Drawing element not found");
        }

        if (request.x() != null) boardElement.setX(request.x());
        if (request.y() != null) boardElement.setY(request.y());
        if (request.z() != null) boardElement.setZ(request.z());
        if (request.width() != null) boardElement.setWidth(request.width());
        if (request.height() != null) boardElement.setHeight(request.height());
        if (request.color() != null) drawingElement.setColor(request.color());
        if (request.strokeWidth() != null) drawingElement.setStrokeWidth(request.strokeWidth());
        if (request.points() != null) {
            try {
                drawingElement.setPointsData(objectMapper.writeValueAsString(request.points()));
            } catch (JsonProcessingException e) {
                drawingElement.setPointsData("[]");
            }
        }

        boardElementRepository.save(boardElement);
        drawingElementRepository.save(drawingElement);

        return drawingElementMapper.toResponse(boardElement, drawingElement);
    }

    @Transactional
    public void deleteDrawing(Long elementId) {
        BoardElement boardElement = boardElementRepository.findById(elementId)
                .orElseThrow(() -> new RuntimeException("Element not found"));

        DrawingElement drawingElement = drawingElementRepository.findByBoardElementId(elementId);
        if (drawingElement != null) {
            drawingElementRepository.delete(drawingElement);
        }

        boardElementRepository.delete(boardElement);
    }
}
