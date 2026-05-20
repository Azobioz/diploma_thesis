package com.azobioz.board.repository;

import com.azobioz.board.model.DrawingElement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DrawingElementRepository extends JpaRepository<DrawingElement, Long> {
    DrawingElement findByBoardElementId(Long boardElementId);
}
