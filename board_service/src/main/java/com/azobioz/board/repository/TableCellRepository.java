package com.azobioz.board.repository;

import com.azobioz.board.model.TableCell;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TableCellRepository extends JpaRepository<TableCell, Long> {
    Optional<TableCell> findByTableElementIdAndRowAndCol(Long tableElementId, int row, int col);
}
