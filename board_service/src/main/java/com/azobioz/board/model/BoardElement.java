package com.azobioz.board.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;


@Entity
@Data
public class BoardElement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String type; // например: "square", "circle", "text"

    @Column(nullable = false)
    private int x; // позиция по оси X

    @Column(nullable = false)
    private int y; // позиция по оси Y

    @Column
    private int width; // ширина элемента

    @Column
    private int height; // высота элемента

    @Column
    private String color;


    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    private Board board;
}
