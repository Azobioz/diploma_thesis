package com.azobioz.board.repository;

import com.azobioz.board.model.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardRepository extends JpaRepository<Board,Integer> {
    Board findBoardById(Long id);
    List<Board> findAll();
    void deleteBoardById(Integer id);
}
