package com.azobioz.aggregator.dto.board;

import java.time.LocalDate;

public record GetShortSpaceResponse(Long id,
                                    String spaceName,
                                    String spaceDescription,
                                    LocalDate createdAt) {
}
