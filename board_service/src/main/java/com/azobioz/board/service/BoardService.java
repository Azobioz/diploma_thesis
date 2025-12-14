package com.azobioz.board.service;

import com.azobioz.board.dto.BoardRequest;
import com.azobioz.board.dto.GetBoardResponse;
import com.azobioz.board.dto.GetBoardsResponse;
import com.azobioz.board.model.Board;
import com.azobioz.board.model.BoardLength;
import com.azobioz.board.repository.BoardRepository;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BoardService {

    private BoardRepository boardRepository;
    private BoardLength boardLength;

    public BoardService(BoardRepository boardRepository, BoardLength boardLength) {
        this.boardRepository = boardRepository;
        this.boardLength = boardLength;
    }


    public GetBoardResponse createUser(BoardRequest request){
        Board board = new Board();
        board.setName(request.name());
        board.setBackground(request.background());
        boardRepository.save(board);
        return new GetBoardResponse(board.getName(), boardLength.getX(), boardLength.getY(), board.getBackground());
    }

    public GetBoardResponse getBoardById(Integer id){
        Board board = boardRepository.findBoardById(Long.valueOf(id));
        return new GetBoardResponse(board.getName(), boardLength.getX(), boardLength.getY(), board.getBackground());
    }

    public List<GetBoardsResponse> getBoards() {
        return boardRepository.findAll().stream().map(
                board -> new GetBoardsResponse(board.getId(), board.getName(), board.getBackground())
        ).collect(Collectors.toList());
    }

    public String deleteBoardById(Integer id) {
        Board board = boardRepository.findBoardById(Long.valueOf(id));
        boardRepository.deleteById(id);
        return "Board with name " + board.getName() + " has been deleted";
    }

    public GetBoardResponse editBoard(Integer id, BoardRequest request){
        Board board = boardRepository.findBoardById(Long.valueOf(id));
        if (request.name() != null && !request.name().equals(board.getName()) && !request.name().isBlank()) {
            board.setName(request.name());
        }
        if (request.background() != null && !request.background().equals(board.getBackground()) && !request.background().isBlank()) {
            board.setBackground(request.background());
        }
        boardRepository.save(board);
        return new GetBoardResponse(board.getName(), boardLength.getX(), boardLength.getY(), board.getBackground());
    }

}
