package com.azobioz.board.model;

import lombok.Data;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Data
@Getter
@Component
public class BoardLength {
    @Value("${board.size.x}")
    private Integer x;
    @Value("${board.size.y}")
    private Integer y;
}
