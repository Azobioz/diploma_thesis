package com.azobioz.board.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "text_element")
public class TextElement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "content")
    private String content;

    @Column(name = "font_size")
    private int fontSize;

    @Column(name = "font_family")
    private String fontFamily;

    @Column(name = "color")
    private String color;

    @OneToOne
    @JoinColumn(name = "board_element_id")
    private BoardElement boardElement;
}
