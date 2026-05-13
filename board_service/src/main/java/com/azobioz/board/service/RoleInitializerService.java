package com.azobioz.board.service;

import com.azobioz.board.model.Role;
import com.azobioz.board.model.RoleType;
import com.azobioz.board.repository.RoleRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleInitializerService {

    private final RoleRepository roleRepository;

    @PostConstruct
    @Transactional
    public void initRoles() {
        List<RoleType> allRoles = Arrays.asList(
                RoleType.CREATOR_OF_BOARD,
                RoleType.CREATOR_OF_SPACE,
                RoleType.CREATOR_OF_TASK,
                RoleType.EDITOR_OF_BOARD,
                RoleType.MEMBER,
                RoleType.CREATOR_OF_TASK_LIST
        );

        for (RoleType roleType : allRoles) {
            if (roleRepository.findByRoleType(roleType).isEmpty()) {
                Role role = new Role();
                role.setRoleType(roleType);
                roleRepository.save(role);
                System.out.println("Role created: " + roleType);
            }
        }
    }
}
