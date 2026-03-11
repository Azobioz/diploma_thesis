package com.azobioz.board.service;

import com.azobioz.board.dto.BoardRequest;
import com.azobioz.board.dto.GetBoardResponse;
import com.azobioz.board.dto.GetBoardsResponse;
import com.azobioz.board.dto.UpdateBoardRequest;
import com.azobioz.board.model.Board;
import com.azobioz.board.repository.BoardRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BoardService {

    private BoardRepository boardRepository;

    public BoardService(BoardRepository boardRepository) {
        this.boardRepository = boardRepository;
    }


    public GetBoardResponse createBoard(BoardRequest request){
        Board board = new Board();
        board.setName(request.name());
        board.setBackground(request.background());
        boardRepository.save(board);
        return new GetBoardResponse(board.getName(), board.getBackground());
    }

    public GetBoardResponse getBoardById(Long id){
        Board board = boardRepository.findBoardById(id);

        if(board == null){
            throw new RuntimeException("Board with id " + id + " does not exists");
        }

        return new GetBoardResponse(board.getName(), board.getBackground());
    }

    public List<GetBoardsResponse> getBoards() {
        return boardRepository.findAll().stream().map(
                board -> new GetBoardsResponse(board.getId(), board.getName(), board.getBackground())
        ).collect(Collectors.toList());
    }

    public String deleteBoardById(Long id) {
        Board board = boardRepository.findBoardById(id);
        boardRepository.deleteById(id);
        return "Board with name " + board.getName() + " has been deleted";
    }

    public GetBoardResponse updateBoardName(Long id, UpdateBoardRequest request){
        Board board = boardRepository.findBoardById(id);
        if (request.name() != null && !request.name().equals(board.getName()) && !request.name().isBlank()) {
            board.setName(request.name());
        }
        boardRepository.save(board);
        return new GetBoardResponse(board.getName(), board.getBackground());
    }

}
