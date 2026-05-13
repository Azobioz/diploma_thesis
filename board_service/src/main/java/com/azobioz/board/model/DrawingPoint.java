package com.azobioz.board.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "drawing_point")
public class DrawingPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "x")
    private int x;

    @Column(name = "y")
    private int y;

    @Column(name = "order_index")
    private int orderIndex;

    @ManyToOne
    @JoinColumn(name = "drawing_element_id")
    private DrawingElement drawingElement;

}
