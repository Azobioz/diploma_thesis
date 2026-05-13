package com.azobioz.board.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "arrow_element")
public class ArrowElement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "start_x")
    private int startX;

    @Column(name = "start_y")
    private int startY;

    @Column(name = "end_x")
    private int endX;

    @Column(name = "end_y")
    private int endY;

    @OneToOne
    @JoinColumn(name = "board_element_id")
    private BoardElement boardElement;

}
