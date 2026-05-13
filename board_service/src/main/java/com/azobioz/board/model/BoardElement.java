package com.azobioz.board.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;


@Entity
@Data
@Table(name = "board_element")
public class BoardElement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "type")
    @Enumerated(EnumType.STRING)
    private Element type;

    @Column(name = "x")
    private int x;

    @Column(name = "y")
    private int y;

    @Column(name = "z")
    private int z;

    @Column(name = "width")
    private int width;

    @Column(name = "height")
    private int height;

    @Column(name = "color")
    private String color;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    private Board board;

    @OneToOne(mappedBy = "boardElement", cascade = CascadeType.ALL, orphanRemoval = true)
    private ShapeElement shapeElement;

    @OneToOne(mappedBy = "boardElement", cascade = CascadeType.ALL, orphanRemoval = true)
    private ImageElement imageElement;

    @OneToOne(mappedBy = "boardElement", cascade = CascadeType.ALL, orphanRemoval = true)
    private ArrowElement arrowElement;

    @OneToOne(mappedBy = "boardElement", cascade = CascadeType.ALL, orphanRemoval = true)
    private DrawingElement drawingElement;

    @OneToOne(mappedBy = "boardElement", cascade = CascadeType.ALL, orphanRemoval = true)
    private CommentElement commentElement;

    @OneToOne(mappedBy = "boardElement", cascade = CascadeType.ALL, orphanRemoval = true)
    private TextElement textElement;

    @OneToOne(mappedBy = "boardElement", cascade = CascadeType.ALL, orphanRemoval = true)
    private TableElement tableElement;

}
