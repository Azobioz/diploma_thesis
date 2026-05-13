package com.azobioz.board.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@Table(name = "comment_element")
public class CommentElement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "message")
    private String message;

    @Column(name = "created_at")
    private LocalDateTime createdAt; // хранит дату и время до миллисекунд

    @Column(name = "user_id")
    private Long userId;

    @OneToOne
    @JoinColumn(name = "board_element_id")
    private BoardElement boardElement;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "commentElement", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CommentReplies> comments;

    @Override
    public String toString() {
        return "CommentElement{" +
                "spaceId=" + id +
                ", message='" + message + '\'' +
                ", createdAt=" + createdAt +
                ", userId=" + userId +
                ", boardElement=" + boardElement +
                '}';
    }
}
