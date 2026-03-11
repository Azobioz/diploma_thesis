package com.azobioz.board.unit;

import com.azobioz.board.controller.BoardController;
import com.azobioz.board.dto.*;
import com.azobioz.board.service.BoardService;
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


@WebMvcTest(BoardController.class)
public class BoardTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BoardService boardService;

    @Autowired
    private ObjectMapper objectMapper;


    // ID теста - 1
    @Test
    void createBoard() throws Exception {

        BoardRequest request = new BoardRequest("Test Board","White");
        GetBoardResponse response = new GetBoardResponse("Test Board","White");

        when(boardService.createBoard(request)).thenReturn(response);

        mockMvc.perform(post("/boards/create")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Board"))
                .andExpect(jsonPath("$.background").value("White"));
    }


    // ID теста - 2
    @Test
    void getAllBoards() throws Exception {

        List<GetBoardsResponse> boards = List.of(
                new GetBoardsResponse(1L,"Board1","White"),
                new GetBoardsResponse(2L,"Board2","Blue")
        );

        when(boardService.getBoards()).thenReturn(boards);

        mockMvc.perform(get("/boards"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }


    // ID теста - 3
    @Test
    void getBoardById() throws Exception {

        GetBoardResponse response = new GetBoardResponse("Board1","White");

        when(boardService.getBoardById(1L)).thenReturn(response);

        mockMvc.perform(get("/boards/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Board1"));
    }


    // ID теста - 4
    @Test
    void updateBoard() throws Exception {

        UpdateBoardRequest request = new UpdateBoardRequest(1L,"Updated");

        GetBoardResponse response = new GetBoardResponse("Updated","White");

        when(boardService.updateBoardName(1L,request)).thenReturn(response);

        mockMvc.perform(put("/boards/1/edit")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated"));
    }


    // ID теста - 5
    @Test
    void deleteBoard() throws Exception {

        when(boardService.deleteBoardById(1L))
                .thenReturn("Board with name Test has been deleted");

        mockMvc.perform(delete("/boards/1/delete"))
                .andExpect(status().isOk());
    }


}
