package com.azobioz.board.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Data
@Table(name = "table_element")
public class TableElement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "rows")
    private int rows;

    @Column(name = "columns")
    private int columns;

    @OneToOne
    @JoinColumn(name = "board_element_id")
    private BoardElement boardElement;

    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "tableElement")
    private List<TableCell> tableCells;

    @Override
    public String toString() {
        return "TableElement{" +
                "spaceId=" + id +
                ", rows=" + rows +
                ", columns=" + columns +
                ", boardElement=" + boardElement +
                '}';
    }
}
