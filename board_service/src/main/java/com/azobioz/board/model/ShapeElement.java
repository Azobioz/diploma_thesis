package com.azobioz.board.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "shape_element")
public class ShapeElement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "shape_type")
    @Enumerated(EnumType.STRING)
    private Shape shapeType;

    @Column(name = "border_color")
    private String borderColor;

    @Column(name = "fill_color")
    private String fillColor;

    @Column(name = "text")
    private String text;

    @OneToOne
    @JoinColumn(name = "board_element_id")
    private BoardElement boardElement;
}
