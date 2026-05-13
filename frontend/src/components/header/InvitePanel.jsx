import React, { useState, useEffect, useRef } from 'react';

const InvitePanel = ({
                         isOpen,
                         onClose,
                         spaceId,
                         spaceName,
                         userBoards = [],
                         allSpaceBoards = [],  // Все доски пространства (для создателя пространства)
                         currentUserId = null,
                         isSpaceCreator = false
                     }) => {
    const [inviteType, setInviteType] = useState('space'); // 'space' | 'board'
    const [days, setDays] = useState(5);
    const [inviteLink, setInviteLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [showBoardDropdown, setShowBoardDropdown] = useState(false);
    const [selectedBoardIds, setSelectedBoardIds] = useState([]);
    const boardDropdownRef = useRef(null);

    // Определяем, какие доски показывать
    const availableBoards = isSpaceCreator ? allSpaceBoards : userBoards;
    const hasBoards = availableBoards && availableBoards.length > 0;

    // Получаем имена выбранных досок
    const selectedBoards = availableBoards.filter(board =>
        selectedBoardIds.includes(board.boardId)
    );

    const getSelectedBoardsText = () => {
        if (selectedBoards.length === 0) return 'Доску...';
        if (selectedBoards.length === 1) return selectedBoards[0].boardName;
        return `${selectedBoards[0].boardName}, ${selectedBoards[1].boardName}, ...`;
    };

    // Закрытие dropdown при клике вне
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (boardDropdownRef.current && !boardDropdownRef.current.contains(event.target)) {
                setShowBoardDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Сброс состояния при открытии
    useEffect(() => {
        if (isOpen) {
            setInviteType(isSpaceCreator ? 'space' : 'board');
            setDays(5);
            setInviteLink('');
            setCopied(false);
            setSelectedBoardIds([]);
            setShowBoardDropdown(false);
        }
    }, [isOpen, isSpaceCreator]);

    const handleBoardToggle = (boardId) => {

        if (boardId == null) {
            console.error('boardId is null!', boardId);
            return;
        }

        setSelectedBoardIds(prev =>
            prev.includes(boardId)
                ? prev.filter(id => id !== boardId)
                : [...prev, boardId]
        );



    };

    const handleCreateAndCopy = async () => {
        const token = localStorage.getItem('accessToken');

        try {
            let url;
            let body;

            if (inviteType === 'space') {
                // Приглашение в пространство
                url = `http://localhost:8081/boardiox/spaces/${spaceId}/invitations/create`;
                body = JSON.stringify({ expiresInDays: days });
            } else {
                // Приглашение в доски
                if (selectedBoardIds.length === 0) {
                    alert('Выберите хотя бы одну доску');
                    return;
                }

                url = `http://localhost:8081/boardiox/spaces/${spaceId}/board-invitations/create`;
                body = JSON.stringify({
                    boardIds: selectedBoardIds,  // ← Убедитесь, что это массив чисел
                    expiresInDays: days
                });

                console.log('Sending boardIds:', selectedBoardIds); // Для отладки
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: body
            });

            if (!res.ok) throw new Error('Ошибка создания ссылки');

            const data = await res.json();
            setInviteLink(data.inviteUrl);
            await navigator.clipboard.writeText(data.inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error(err);
            alert('Не удалось создать ссылку. Проверьте консоль.');
        }
    };

    if (!isOpen) return null;



    return (
        <div className="invite-panel-overlay" onClick={onClose}>
            <div className="invite-panel" onClick={e => e.stopPropagation()}>
                {/* Выбор типа приглашения */}
                <div className="invite-type-row">
                    <span className="invite-label">Пригласить в</span>
                    <div className="invite-toggle">
                        {/* Для создателя пространства - кнопка пространства */}
                        {isSpaceCreator && (
                            <button
                                className={`toggle-btn ${inviteType === 'space' ? 'active' : ''}`}
                                onClick={() => { setInviteType('space'); setShowBoardDropdown(false); }}
                            >
                                {spaceName}
                            </button>
                        )}

                        {/* Кнопка выбора досок */}
                        <div className="board-select-wrapper" ref={boardDropdownRef}>
                            <button
                                className={`toggle-btn ${inviteType === 'board' ? 'active' : ''}`}
                                onClick={() => {
                                    setInviteType('board');
                                    setShowBoardDropdown(!showBoardDropdown);
                                }}
                            >
                                {inviteType === 'board' ? getSelectedBoardsText() : 'Доску...'}
                            </button>

                            {/* Dropdown со списком досок */}
                            {showBoardDropdown && inviteType === 'board' && (
                                <div className="board-dropdown">
                                    <div className="board-dropdown-list">
                                        {availableBoards.map(board => (
                                            <div
                                                key={board.boardId}
                                                className="board-dropdown-item"
                                            >
                                                <span
                                                    className="board-name"
                                                    onClick={() => handleBoardToggle(board.boardId)}
                                                    style={{ cursor: 'pointer', flex: 1 }}
                                                >
                                                    {board.boardName}
                                                </span>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBoardIds.includes(board.boardId)}
                                                    onChange={() => handleBoardToggle(board.boardId)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Срок действия */}
                <div className="invite-expiration-row">
                    <span className="invite-label">Срок истечения</span>
                    <div className="days-input-wrapper">
                        <input
                            type="text"

                            max="365"
                            value={days}
                            onChange={e => setDays(parseInt(e.target.value) || 1)}
                        />
                        <span>дней</span>
                    </div>
                </div>

                {/* Кнопка копирования */}
                <button className="copy-invite-btn" onClick={handleCreateAndCopy} disabled={copied}>
                    <i className={`bi ${copied ? 'bi-check-lg' : 'bi-link-45deg'}`}></i>
                    {copied ? 'Ссылка скопирована' : 'Скопировать ссылку на приглашение'}
                </button>
            </div>
        </div>
    );
};

export default InvitePanel;