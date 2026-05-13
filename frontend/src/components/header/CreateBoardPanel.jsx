import React, { useState, useEffect, useRef } from 'react';

const CreateBoardPanel = ({
                              isOpen,
                              onClose,
                              onSubmit,
                              usersInSpace = [],
                              currentUserId = null,
                              spaceCreatorId = null
                          }) => {
    const [boardName, setBoardName] = useState('');
    const [visibility, setVisibility] = useState('all');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [errors, setErrors] = useState({ boardName: '' });
    const modalRef = useRef(null);

    const MAX_BOARD_NAME_LENGTH = 50;

    // Фильтруем пользователей
    const availableUsers = usersInSpace.filter(user =>
        user.userId !== currentUserId && user.userId !== spaceCreatorId
    );

    const filteredUsers = availableUsers.filter(user =>
        user.nickname.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Валидация названия доски
    const validateBoardName = (name) => {
        if (name.length > MAX_BOARD_NAME_LENGTH) {
            return `Название не должно превышать ${MAX_BOARD_NAME_LENGTH} символов`;
        }
        return '';
    };

    const handleBoardNameChange = (e) => {
        const value = e.target.value;
        setBoardName(value);
        const error = validateBoardName(value);
        setErrors(prev => ({ ...prev, boardName: error }));
    };

    // Закрытие при клике вне панели
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Сброс формы при открытии
    useEffect(() => {
        if (isOpen) {
            setBoardName('');
            setVisibility('all');
            setSelectedUsers([]);
            setSearchQuery('');
            setErrors({ boardName: '' });
        }
    }, [isOpen]);

    const handleClose = () => {
        setBoardName('');
        setVisibility('all');
        setSelectedUsers([]);
        setSearchQuery('');
        setErrors({ boardName: '' });
        onClose();
    };

    const handleUserToggle = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSubmit = () => {
        const error = validateBoardName(boardName);
        setErrors({ boardName: error });

        if (error || !boardName.trim()) {
            return;
        }

        const participants = new Set();

        if (spaceCreatorId) participants.add(spaceCreatorId);
        if (currentUserId) participants.add(currentUserId);

        if (visibility === 'specific') {
            selectedUsers.forEach(userId => participants.add(userId));
        } else {
            usersInSpace.forEach(user => participants.add(user.userId));
        }

        onSubmit({
            boardName: boardName.trim(),
            participantIds: Array.from(participants)
        });

        handleClose();
    };

    // Проверка: можно ли подтвердить (нет ошибок + название не пустое + не больше 50 символов)
    const isConfirmDisabled = !boardName.trim() ||
        boardName.length > MAX_BOARD_NAME_LENGTH ||
        !!errors.boardName;

    if (!isOpen) return null;

    return (
        <div className="create-board-panel-overlay">
            <div className="create-board-panel" ref={modalRef}>
                <div className="modal-body">
                    {/* Поле ввода названия */}
                    <div className="board-name-form">
                        <input
                            type="text"
                            value={boardName}
                            onChange={handleBoardNameChange}
                            placeholder="Введите название доски"
                            className={`board-name-input ${errors.boardName ? 'input-error' : ''}`}
                            autoFocus
                            maxLength={MAX_BOARD_NAME_LENGTH + 10}
                        />
                        {/* Сообщение об ошибке */}
                        {errors.boardName && (
                            <div className="error-message-board-name">
                                {errors.boardName}
                            </div>
                        )}
                    </div>

                    <div className="block-behind-all-and-only-to"></div>

                    {/* Выбор видимости */}
                    <div className="choose-visibility-of-board">
                        <div className="board-available-text">Доска доступна</div>
                        <div className="all-and-only-to-text">
                            <button
                                className={`visibility-btn ${visibility === 'all' ? 'active' : ''}`}
                                onClick={() => setVisibility('all')}
                            >
                                Всем
                            </button>
                            <button
                                className={`visibility-btn ${visibility === 'specific' ? 'active' : ''}`}
                                onClick={() => setVisibility('specific')}
                            >
                                Только...
                            </button>
                        </div>
                    </div>

                    {/* Список пользователей */}
                    {visibility === 'specific' && (
                        <div className="user-selection-panel">
                            <div className="search-user-box">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Найти по никнейму"
                                />
                            </div>
                            <div className="users-list">
                                {filteredUsers.length === 0 ? (
                                    <div className="no-users-text">Нет доступных пользователей</div>
                                ) : (
                                    filteredUsers.map(user => (
                                        <div
                                            key={user.userId}
                                            className={`user-item ${selectedUsers.includes(user.userId) ? 'selected' : ''}`}
                                            onClick={() => handleUserToggle(user.userId)}
                                        >
                                            <div className="user-avatar-small">
                                                {user.avatar ? (
                                                    <img
                                                        src={`data:image/png;base64,${user.avatar}`}
                                                        alt={user.nickname}
                                                    />
                                                ) : (
                                                    <span>{user.nickname.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <span className="user-nickname">{user.nickname}</span>
                                            <div className={`checkbox ${selectedUsers.includes(user.userId) ? 'checked' : ''}`}>
                                                {selectedUsers.includes(user.userId) && (
                                                    <svg width="16" height="16" viewBox="0 0 16 16">
                                                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel-create-board" onClick={handleClose}>
                        Отмена
                    </button>
                    <button
                        className={`btn-confirm-create-board ${isConfirmDisabled ? 'btn-disabled' : ''}`}
                        onClick={handleSubmit}
                        disabled={isConfirmDisabled}
                    >
                        Подтвердить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateBoardPanel;