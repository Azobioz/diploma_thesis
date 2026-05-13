import React, { useState, useRef, useEffect } from 'react';
import BoardInfoPanel from './BoardInfoPanel';
import EditBoardPanel from './EditBoardPanel';
import DeleteConfirmPanel from './DeleteConfirmPanel';

const BoardRow = ({
                      board,
                      usersInSpace = [],
                      onEdit,
                      onDelete,
                      spaceId,
                      currentUserId,
                      spaceCreatorId
                  }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showInfoPanel, setShowInfoPanel] = useState(false);
    const [showEditPanel, setShowEditPanel] = useState(false);
    const [showDeletePanel, setShowDeletePanel] = useState(false);
    const menuRef = useRef(null);

    const owner = usersInSpace.find(u => u.userId === board.boardCreatedByUserId);

    const boardData = {
        boardName: board.boardName,
        ownerName: owner?.nickname || 'Неизвестно',
        createdAt: board.createdAt ? new Date(board.createdAt).toLocaleDateString('ru-RU') : 'Неизвестно'
    };

    // Проверяем, может ли текущий пользователь редактировать/удалять доску
    // Права есть у: создателя доски ИЛИ создателя пространства
    const canEditOrDelete = currentUserId && (
        currentUserId === board.boardCreatedByUserId ||
        currentUserId === spaceCreatorId
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const handleInfoClick = () => {
        setShowMenu(false);
        setShowInfoPanel(true);
    };

    const handleEditClick = () => {
        setShowMenu(false);
        setShowEditPanel(true);
    };

    const handleDeleteClick = () => {
        setShowMenu(false);
        setShowDeletePanel(true);
    };

    const handleEditSubmit = async (newName) => {
        try {
            await onEdit(board.boardId, newName);
            setShowEditPanel(false);
        } catch (error) {
            console.error('Error updating board:', error);
            alert('Ошибка при обновлении названия доски');
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            console.log('Deleting board:', board.boardId, 'in space:', spaceId);
            if (!spaceId || spaceId === '-' || spaceId === 'undefined') {
                throw new Error('Invalid spaceId: ' + spaceId);
            }
            await onDelete(board.boardId);
            setShowDeletePanel(false);
        } catch (error) {
            console.error('Error deleting board:', error);
            alert('Ошибка при удалении доски: ' + error.message);
        }
    };

    const handleOpenInNewTab = () => {
        if (spaceId && spaceId !== '-' && spaceId !== 'undefined') {
            window.open(`/boardiox/spaces/${spaceId}/boards/${board.boardId}`, '_blank');
        }
        setShowMenu(false);
    };

    return (
        <>
            <div className="board-row">
                <div className="board-name-data">{board.boardName}</div>
                <div className="owner-of-board-data">{owner?.nickname || 'Unknown'}</div>
                <div className="three-dots-in-board-row" ref={menuRef}>
                    <button
                        className="three-dots-in-board-row-button"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <i className="bi bi-three-dots"></i>
                    </button>

                    {showMenu && (
                        <div className="board-context-menu">
                            <div className="context-menu-item" onClick={handleInfoClick}>
                                <i className="bi bi-info-circle"></i>
                                <span>Инфо</span>
                            </div>

                            <div className="context-menu-item" onClick={handleOpenInNewTab}>
                                <i className="bi bi-box-arrow-up-right"></i>
                                <span>Открыть в новой вкладке</span>
                            </div>

                            {canEditOrDelete && (
                                <>
                                    <div className="context-menu-item" onClick={handleEditClick}>
                                        <i className="bi bi-pencil"></i>
                                        <span>Изменить</span>
                                    </div>

                                    <div className="context-menu-item danger" onClick={handleDeleteClick}>
                                        <i className="bi bi-trash"></i>
                                        <span>Удалить</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <BoardInfoPanel
                isOpen={showInfoPanel}
                onClose={() => setShowInfoPanel(false)}
                boardData={boardData}
            />

            <EditBoardPanel
                isOpen={showEditPanel}
                onClose={() => setShowEditPanel(false)}
                onSubmit={handleEditSubmit}
                initialName={board.boardName}
            />

            <DeleteConfirmPanel
                isOpen={showDeletePanel}
                onClose={() => setShowDeletePanel(false)}
                onConfirm={handleDeleteConfirm}
                boardName={board.boardName}
            />
        </>
    );
};

export default BoardRow;