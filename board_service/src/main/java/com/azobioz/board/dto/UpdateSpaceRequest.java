package com.azobioz.board.dto;

public record UpdateSpaceRequest(
        String spaceName,
        String spaceDescription
) {
}
