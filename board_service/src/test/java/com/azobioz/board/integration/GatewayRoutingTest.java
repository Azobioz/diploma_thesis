package com.azobioz.board.integration;

import com.azobioz.board.dto.BoardRequest;
import com.azobioz.board.dto.GetBoardResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class GatewayRoutingTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;


    // ID теста - 10
    @Test
    void createBoardViaHttp() {

        String url = "http://localhost:" + port + "/boards/create";

        BoardRequest request = new BoardRequest("Integration Board", "White");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<BoardRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<GetBoardResponse> response =
                restTemplate.postForEntity(url, entity, GetBoardResponse.class);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Integration Board", response.getBody().name());
        assertEquals("White", response.getBody().background());
    }
}