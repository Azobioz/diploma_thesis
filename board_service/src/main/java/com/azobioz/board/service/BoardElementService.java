package com.azobioz.board.service;

import com.azobioz.board.model.BoardElement;
import com.azobioz.board.repository.BoardElementRepository;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BoardElementService {
    private final BoardElementRepository repository;

    public List<BoardElement> getElements(Long boardId) {
        return repository.findAllByBoardId(boardId);
    }

    public BoardElement createElement(BoardElement element) {
        return repository.save(element);
    }

    public BoardElement updateElement(BoardElement element) {

        BoardElement existing = repository.findById(element.getId())
                .orElseThrow(() -> new RuntimeException("Element not found"));

        existing.setX(element.getX());
        existing.setY(element.getY());
        existing.setWidth(element.getWidth());
        existing.setHeight(element.getHeight());
        existing.setColor(element.getColor());
        existing.setType(element.getType());

        return repository.save(existing);
    }

    public void deleteElement(Long elementId, Long boardId) {
        BoardElement element = repository.findById(elementId)
                .orElseThrow(() -> new RuntimeException("Element not found"));

        if (!element.getBoard().getId().equals(boardId)) {
            throw new RuntimeException("Element does not belong to this board");
        }

        repository.delete(element);
    }
}