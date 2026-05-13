package com.azobioz.board.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "user_in_space_with_role")
public class UserInSpaceWithRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;

    @ManyToOne
    @JoinColumn(name = "space_id")
    private Space space;
}
