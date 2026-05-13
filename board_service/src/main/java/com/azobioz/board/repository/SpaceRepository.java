package com.azobioz.board.repository;

import com.azobioz.board.model.Space;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SpaceRepository extends JpaRepository<Space, Long> {
    Space getSpaceById(Long spaceId);
}
