import React from 'react';
import BoardRow from './BoardRow';
import BoardFilters from "./BoardFilters";
import {useNavigate} from "react-router-dom";

const SpaceMainContent = ({
                              spaceId = null,
                              spaceName = '',
                              boards = [],
                              usersInSpace = [],
                              currentUserId = null,
                              spaceCreatorId = null,
                              filter = 'all',
                              sort = 'recent',
                              onFilterChange,
                              onSortChange,
                              onCreateBoard = () => {},
                              onEditBoard,
                              onDeleteBoard
                          }) => {

    const navigate = useNavigate();

    // Функция для обновления last_view_at при клике на доску
    const handleBoardClick = async (boardId) => {
        try {
            const token = localStorage.getItem('accessToken');
            await fetch(`http://localhost:8081/boardiox/spaces/${spaceId}/boards/${boardId}/view`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error updating last viewed at:', error);
        }
    };

    // Функция для перехода на страницу доски
    const handleBoardPageClick = (boardId) => {
        handleBoardClick(boardId)
        navigate(`/boardiox/spaces/${spaceId}/boards/${boardId}`);

    };

    const handleTasksClick = () => {
        // Получаем первую доску или переходим на создание
        if (boards.length > 0) {
            navigate(`/boardiox/spaces/${spaceId}/boards/${boards[0].boardId}/tasks`);
        }
        else {
            alert('Сначала создайте доску');
        }
    };

    return (
        <main className="space-main-content">

            <div className="boards-in-space-text">
                {spaceName}
            </div>
            <div className="tasks-and-create-board-text">
                <button className="tasks-button" onClick={handleTasksClick}>
                    Задачи
                </button>
                <div className="line-between-tasks-and-create-board-buttons"></div>
                <button
                    className="create-board-button"
                    onClick={onCreateBoard}
                >
                    <span>
                        <i className="bi bi-plus-lg"></i>
                    </span>Новая доска
                </button>
            </div>


            {/* Компонент фильтрации и сортировки */}
            <BoardFilters
                filter={filter}
                sort={sort}
                onFilterChange={onFilterChange}
                onSortChange={onSortChange}
            />

            <div className="boards-group">
                <div className="boards-header">
                    <div className="board-name-text">Название</div>
                    <div className="created-by-user-text">Владелец</div>
                </div>
                <div className="boards-row">
                    {boards.map(board => (
                        <div
                            key={board.boardId}
                            onClick={() => handleBoardPageClick(board.boardId)}
                        >
                            <BoardRow
                                board={board}
                                usersInSpace={usersInSpace}
                                onEdit={onEditBoard}
                                onDelete={onDeleteBoard}
                                spaceId={spaceId}
                                currentUserId={currentUserId}
                                spaceCreatorId={spaceCreatorId}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
};

export default SpaceMainContent;