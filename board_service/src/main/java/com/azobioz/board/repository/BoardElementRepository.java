package com.azobioz.board.repository;

import com.azobioz.board.model.BoardElement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardElementRepository extends JpaRepository<BoardElement, Long> {
    List<BoardElement> findAllByBoardId(Long boardId);
}