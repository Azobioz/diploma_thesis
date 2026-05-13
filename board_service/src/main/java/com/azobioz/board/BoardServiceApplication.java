package com.azobioz.board;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@SpringBootApplication
@EntityScan()
public class BoardServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(BoardServiceApplication.class, args);
    }
}
