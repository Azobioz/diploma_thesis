package com.azobioz.board.unit;

import com.azobioz.board.controller.BoardController;
import com.azobioz.board.dto.BoardRequest;
import com.azobioz.board.service.BoardService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BoardController.class)
public class BoardValidationTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BoardService boardService;

    @Autowired
    private ObjectMapper objectMapper;


    // ID теста - 11
    @Test
    void createBoardWithLongName() throws Exception {

        BoardRequest request = new BoardRequest(
                "12345678901234567890123456789012345678901234567890",
                "White"
        );

        mockMvc.perform(post("/boards/create")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }


    // ID теста - 14
    @Test
    void createBoardWithoutName() throws Exception {

        BoardRequest request = new BoardRequest(null,"White");

        mockMvc.perform(post("/boards/create")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }


    // ID теста - 15
    @Test
    void createBoardWithBlankName() throws Exception {

        BoardRequest request = new BoardRequest("   ","White");

        mockMvc.perform(post("/boards/create")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

}
