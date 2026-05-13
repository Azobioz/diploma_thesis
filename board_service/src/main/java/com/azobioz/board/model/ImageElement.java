package com.azobioz.board.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "image_element")
public class ImageElement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Lob //Говорит Hibernate, что это Large Object (BLOB / bytea)
    @Column(name = "image")
    private byte[] image;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_element_id")
    private BoardElement boardElement;
}
