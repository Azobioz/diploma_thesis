package com.azobioz.board.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Data
@Table(name = "role")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "role_type")
    @Enumerated(EnumType.STRING)
    private RoleType roleType;

    @OneToMany(fetch =  FetchType.LAZY, mappedBy = "role", orphanRemoval = true, cascade = CascadeType.ALL)
    private List<UserInBoard> userInBoardList;

    @OneToMany(mappedBy = "role", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserInSpaceWithRole> userInSpaceWithRoleList;

    @Override
    public String toString() {
        return "Role{" +
                "spaceId=" + id +
                ", roleType=" + roleType +
                '}';
    }
}
