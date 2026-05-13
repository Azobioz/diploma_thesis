package com.azobioz.board.repository;

import com.azobioz.board.model.Board;
import com.azobioz.board.model.Role;
import com.azobioz.board.model.UserInBoard;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserInBoardRepository extends JpaRepository<UserInBoard, Long> {
    UserInBoard getUserInBoardByBoard(Board board);

    UserInBoard getUserInBoardByBoard_AndRole(Board board, Role role);

    List<UserInBoard> getUserInBoardsByBoard(Board board);

    UserInBoard getUserInBoardByBoardAndUserId(Board board, Long userId);

    @Query("SELECT uib FROM UserInBoard uib JOIN uib.board b WHERE uib.userId = :userId AND b.space.id = :spaceId")
    List<UserInBoard> getUserInBoardsByUserIdAndSpaceId(@Param("userId") Long userId, @Param("spaceId") Long spaceId);

    UserInBoard findByBoardIdAndUserId(Long boardId, Long userId);

    List<UserInBoard> findByUserIdAndRole(Long userId, Role role);
}
