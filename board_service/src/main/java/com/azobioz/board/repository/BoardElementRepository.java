package com.azobioz.board.repository;

import com.azobioz.board.model.BoardElement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoardElementRepository extends JpaRepository<BoardElement, Long> {
    List<BoardElement> findAllByBoardId(Long boardId);
}