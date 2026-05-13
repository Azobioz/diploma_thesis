package com.azobioz.board.repository;

import com.azobioz.board.dto.SpaceDto;
import com.azobioz.board.model.Space;
import com.azobioz.board.model.UserInSpaceWithRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserInSpaceWithRoleRepository extends JpaRepository<UserInSpaceWithRole, Long> {
    UserInSpaceWithRole getUserInSpaceWithRoleById(Long id);
    List<UserInSpaceWithRole> findBySpaceId(Long spaceId);

    List<Long> getUserInSpaceWithRoleBySpace(Space space);

    List<UserInSpaceWithRole> getUserInSpaceWithRolesBySpace(Space space);

    List<UserInSpaceWithRole> getUserInSpaceWithRolesByUserId(Long userId);

    UserInSpaceWithRole findBySpaceIdAndUserId(Long spaceId, Long userId);
}
