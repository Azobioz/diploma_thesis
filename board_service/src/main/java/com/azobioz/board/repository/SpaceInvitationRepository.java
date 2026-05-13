package com.azobioz.board.repository;

import com.azobioz.board.model.SpaceInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SpaceInvitationRepository extends JpaRepository<SpaceInvitation, Long> {
    Optional<SpaceInvitation> findByToken(String token);
}
