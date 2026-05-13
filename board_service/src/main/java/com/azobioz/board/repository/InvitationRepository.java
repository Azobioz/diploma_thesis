package com.azobioz.board.repository;

import com.azobioz.board.model.SpaceInvitation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvitationRepository extends JpaRepository<SpaceInvitation, Long> {
}
