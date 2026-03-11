package com.azobioz.board.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BoardRequest(
        @NotBlank(message = "Cannot create board without name")
        @Size(max = 30, message = "Board name max length is 30")
        String name,

        String background
) {
}
