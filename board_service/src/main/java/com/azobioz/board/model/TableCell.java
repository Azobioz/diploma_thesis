package com.azobioz.board.model;


import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "table_cell")
public class TableCell {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "row")
    private int row;

    @Column(name = "col")
    private int col;

    @Column(name = "content")
    private String content;

    @Column(name = "font_size")
    private Integer fontSize;

    @Column(name = "font_family")
    private String fontFamily;

    @Column(name = "is_bold")
    private Boolean isBold;

    @Column(name = "is_underline")
    private Boolean isUnderline;

    @ManyToOne
    @JoinColumn(name = "table_element_id")
    private TableElement tableElement;
}
