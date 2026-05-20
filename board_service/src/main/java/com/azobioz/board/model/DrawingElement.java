package com.azobioz.board.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "drawing_element")
public class DrawingElement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "points_data", columnDefinition = "TEXT")
    private String pointsData; // JSON string of points array

    @Column(name = "color")
    private String color;

    @Column(name = "stroke_width")
    private Integer strokeWidth;

    @OneToOne
    @JoinColumn(name = "board_element_id")
    private BoardElement boardElement;
}
