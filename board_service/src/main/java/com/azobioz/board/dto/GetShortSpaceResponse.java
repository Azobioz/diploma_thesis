package com.azobioz.board.dto;

import java.time.LocalDate;

public record GetShortSpaceResponse(Long id,
                                    String spaceName,
                                    String spaceDescription,
                                    LocalDate createdAt)
{}
