package com.azobioz.board.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Data
@Table(name = "drawing_element")
public class DrawingElement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tool_type")
    @Enumerated(EnumType.STRING)
    private ToolType tool;

    @Column(name = "color")
    private String color;

    @Column(name = "stroke_width")
    private int strokeWidth; // Толщина линии

    @OneToOne
    @JoinColumn(name = "board_element_id")
    private BoardElement boardElement;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "drawingElement", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DrawingPoint> drawingPoints;

    @Override
    public String toString() {
        return "DrawingElement{" +
                "spaceId=" + id +
                ", tool=" + tool +
                ", color='" + color + '\'' +
                ", boardElement=" + boardElement +
                '}';
    }
}
