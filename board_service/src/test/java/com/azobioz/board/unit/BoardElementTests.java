package com.azobioz.board.unit;

import com.azobioz.board.controller.BoardElementController;
import com.azobioz.board.model.Board;
import com.azobioz.board.model.BoardElement;
import com.azobioz.board.repository.BoardRepository;
import com.azobioz.board.service.BoardElementService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BoardElementController.class)
public class BoardElementTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BoardElementService boardElementService;

    @MockBean
    private BoardRepository boardRepository;

    @Autowired
    private ObjectMapper objectMapper;


    // ID теста - 6
    @Test
    void createElement() throws Exception {

        Board board = new Board(1L,"Test","White");

        BoardElement element = new BoardElement();
        element.setType("RECT");
        element.setX(10);
        element.setY(20);

        when(boardRepository.findBoardById(1L)).thenReturn(board);
        when(boardElementService.createElement(element)).thenReturn(element);

        mockMvc.perform(post("/boards/1/elements")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(element)))
                .andExpect(status().isOk());
    }


    // ID теста - 7
    @Test
    void getAllElements() throws Exception {

        BoardElement element = new BoardElement();
        element.setType("RECT");

        when(boardElementService.getElements(1L))
                .thenReturn(List.of(element));

        mockMvc.perform(get("/boards/1/elements"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }


    // ID теста - 8
    @Test
    void updateElement() throws Exception {

        Board board = new Board(1L,"Test","White");

        BoardElement element = new BoardElement();
        element.setType("RECT");

        when(boardRepository.findBoardById(1L)).thenReturn(board);
        when(boardElementService.updateElement(element)).thenReturn(element);

        mockMvc.perform(put("/boards/1/elements/1")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(element)))
                .andExpect(status().isOk());
    }


    // ID теста - 9
    @Test
    void deleteElement() throws Exception {

        Board board = new Board(1L,"Test","White");

        when(boardRepository.findBoardById(1L)).thenReturn(board);

        mockMvc.perform(delete("/boards/1/elements/1"))
                .andExpect(status().isOk());
    }

}