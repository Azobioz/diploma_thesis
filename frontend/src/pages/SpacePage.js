
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/header/Header';
import SpaceMainContent from '../components/space/SpaceMainContent';
import SpaceLeftSidebar from "../components/space/SpaceLeftSidebar";
import CreateBoardPanel from "../components/header/CreateBoardPanel";

const SpacePage = () => {
    const { spaceId } = useParams();
    const navigate = useNavigate();
    const [allSpaceBoards, setAllSpaceBoards] = useState([]);

    // Состояния
    const [spaceData, setSpaceData] = useState(null);
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateBoardPanelOpen, setIsCreateBoardPanelOpen] = useState(false);
    const [userBoards, setUserBoards] = useState([]);
    const [filter, setFilter] = useState('all');
    const [sort, setSort] = useState('recent');
    const [spacesOwnership, setSpacesOwnership] = useState({});
    const [unreadCount, setUnreadCount] = useState(0);

    // Загрузка счётчика непрочитанных уведомлений
    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (!spaceId) return;
            const token = localStorage.getItem('accessToken');
            if (!token) return;
            try {
                const res = await fetch(
                    `http://localhost:8081/boardiox/spaces/${spaceId}/notifications`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                if (res.ok) {
                    const data = await res.json();
                    const count = (data || []).filter(n => !n.read).length;
                    setUnreadCount(count);
                }
            } catch (err) {
                // игнорируем ошибки счётчика
            }
        };

        fetchUnreadCount();

        // Обновляем счётчик при возврате на вкладку (после посещения страницы уведомлений)
        const handleVisibilityChange = () => {
            if (!document.hidden) fetchUnreadCount();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [spaceId]);

    // Загрузка досок пользователя где он CREATOR_OF_BOARD
    useEffect(() => {
        const fetchUserBoards = async () => {
            if (!spaceData?.currentUser?.userId) return;
            const token = localStorage.getItem('accessToken');
            try {
                const response = await fetch(
                    `http://localhost:8081/boardiox/users/${spaceData.currentUser.userId}/created-boards`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                if (response.ok) {
                    const data = await response.json();
                    // Фильтруем только доски из текущего пространства
                    const boardsInCurrentSpace = data.filter(board =>
                        board.spaceId === Number(spaceId)
                    );
                    setUserBoards(boardsInCurrentSpace);
                }
            } catch (err) {
                console.error("Error fetching user boards:", err);
            }
        };

        if (spaceData) {
            fetchUserBoards();
        }
    }, [spaceData, spaceId]);

        // Загрузка основной информации о пространстве
        useEffect(() => {
            const fetchSpaceInfo = async () => {
                if (!spaceId) {
                    console.error("spaceId is undefined");
                    return;
                }

                localStorage.setItem('lastSpaceId', spaceId);
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    console.error("No access token found");
                    navigate('/boardiox/auth'); // Переносим на страницу авторизации, в случае отсутсвия jwt токена
                    return;
                }

                try {
                    setLoading(true);
                    //Ответ запроса к aggregator-service
                    const response = await fetch(`http://localhost:8081/boardiox/spaces/${spaceId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const data = await response.json(); // Тело ответ запроса к aggregator-service
                    setSpaceData(data);
                } catch (err) {
                    if (err.message.includes('401') || err.message.includes('403')) {
                        navigate('/boardiox/auth');
                    }
                } finally {
                    setLoading(false);
                }
            };

            fetchSpaceInfo();
        }, [spaceId, navigate]);

    // Загрузка досок с фильтрацией и сортировкой
    useEffect(() => {
        const fetchFilteredBoards = async () => {
            if (!spaceId) return;
            const token = localStorage.getItem('accessToken');
            try {
                setLoading(true);
                const response = await fetch(
                    `http://localhost:8081/boardiox/spaces/${spaceId}/boards/filtered?filter=${filter}&sort=${sort}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                if (response.ok) {
                    const data = await response.json();
                    setBoards(data.boards || []);
                }
            } catch (err) {
                console.error("Error fetching boards:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFilteredBoards();
    }, [spaceId, filter, sort]);

    useEffect(() => {
        const fetchAllSpaceBoards = async () => {
            const token = localStorage.getItem('accessToken');
            try {
                const response = await fetch(
                    `http://localhost:8081/boardiox/spaces/${spaceId}/boards`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                if (response.ok) {
                    const data = await response.json();
                    setAllSpaceBoards(data.boards || []);
                }
            } catch (err) {
                console.error("Error fetching all space boards:", err);
            }
        };

        if (spaceId) {
            fetchAllSpaceBoards();
        }
    }, [spaceId]);

    if (loading && !spaceData) return <div className="loading">Загрузка...</div>;
    if (!spaceData) return <div className="no-data">Нет данных</div>;

    // Обработчики
    const handleInviteClick = () => alert('Функция приглашения пока не реализована');

    const handleSpaceSelect = (newSpaceId) => navigate(`/boardiox/spaces/${newSpaceId}`);

    const handleCreateBoard = () => setIsCreateBoardPanelOpen(true);

    const handleCreateBoardSubmit = async ({ boardName, participantIds }) => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(`http://localhost:8081/boardiox/spaces/${spaceId}/boards/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ boardName, participantIds })
            });
            if (!response.ok) throw new Error('Failed to create board');
            const newBoard = await response.json();

            // === 1. Обновляем boards (для отображения списка) ===
            const boardWithCreator = {
                ...newBoard,
                boardId: newBoard.boardId,
                boardName: newBoard.boardName,
                boardCreatedByUserId: spaceData.currentUser?.userId,
                createdAt: new Date().toISOString().split('T')[0],
                spaceId: Number(spaceId)
            };
            setBoards(prev => [...prev, boardWithCreator]);

            // === 2. ОБНОВЛЯЕМ userBoards (чтобы кнопка "+ Пригласить" появилась) ===
            const boardForUserBoards = {
                boardId: newBoard.boardId,
                boardName: newBoard.boardName,
                createdAt: new Date().toISOString().split('T')[0],
                boardCreatedByUserId: spaceData.currentUser?.userId,
                spaceId: Number(spaceId)
            };
            setUserBoards(prev => [...prev, boardForUserBoards]);

            // === 3. Обновляем allSpaceBoards (для dropdown в InvitePanel) ===
            setAllSpaceBoards(prev => [...prev, boardWithCreator]);

            setIsCreateBoardPanelOpen(false);
        } catch (err) {
            console.error('Error creating board:', err);
            alert('Ошибка при создании доски');
        }
    };

    // Обработчик создания пространства
    const handleCreateSpace = async ({ spaceName, spaceDescription }) => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(`http://localhost:8081/boardiox/spaces/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    spaceName,
                    spaceDescription
                })
            });
            if (!response.ok) {
                throw new Error('Failed to create space');
            }
            const newSpace = await response.json();
            setSpaceData(prev => ({
                ...prev,
                spacesCurrentUserParticipate: [
                    ...prev.spacesCurrentUserParticipate,
                    {
                        spaceId: newSpace.id,
                        spaceName: newSpace.spaceName
                    }
                ]
            }));
        } catch (err) {
            console.error('Error creating space:', err);
            alert('Ошибка при создании пространства');
        }
    };

    const handleEditSpace = async (spaceIdToEdit, updatedSpaceData) => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(`http://localhost:8081/boardiox/spaces/${spaceIdToEdit}/edit`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedSpaceData)
            });
            if (!response.ok) {
                throw new Error('Failed to edit space');
            }
            // Обновляем состояние реактивно вместо перезагрузки
            setSpaceData(prev => ({
                ...prev,
                spaceName: updatedSpaceData.spaceName,
                // description обновится при следующем запросе или можно добавить поле
            }));
            // Также обновляем название в списке пространств
            setSpaceData(prev => ({
                ...prev,
                spacesCurrentUserParticipate: prev.spacesCurrentUserParticipate.map(space =>
                    space.spaceId === Number(spaceIdToEdit)
                        ? { ...space, spaceName: updatedSpaceData.spaceName }
                        : space
                )
            }));
        } catch (err) {
            console.error('Error editing space:', err);
            alert('Ошибка при редактировании пространства');
        }
    };

    const handleDeleteSpace = async (spaceIdToDelete) => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(`http://localhost:8081/boardiox/spaces/${spaceIdToDelete}/delete`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Failed to delete space');
            }

            // Находим другое пространство из текущего списка (кроме удаленного)
            const otherSpace = spaceData.spacesCurrentUserParticipate.find(
                space => space.spaceId !== Number(spaceIdToDelete)
            );

            if (otherSpace) {
                navigate(`/boardiox/spaces/${otherSpace.spaceId}`);
            } else {
                navigate('/boardiox/auth');
            }
        } catch (err) {
            console.error('Error deleting space:', err);
            alert('Ошибка при удалении пространства');
        }
    };

    const handleEditBoard = async (boardId, newName) => {
        console.log('Editing board:', boardId, 'in space:', spaceId, 'new name:', newName);
        const token = localStorage.getItem('accessToken');
        try {
            if (!spaceId || spaceId === '-' || spaceId === 'undefined') {
                throw new Error('Invalid spaceId: ' + spaceId);
            }

            const response = await fetch(`http://localhost:8081/boardiox/spaces/${spaceId}/boards/${boardId}/edit`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ boardName: newName })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update board: ${response.status} - ${errorText}`);
            }

            // Реактивное обновление состояния
            setBoards(prev => prev.map(board =>
                board.boardId === boardId
                    ? { ...board, boardName: newName }
                    : board
            ));
        } catch (err) {
            console.error('Error editing board:', err);
            throw err;
        }
    };

    const handleDeleteBoard = async (boardId) => {
        console.log('Deleting board:', boardId, 'in space:', spaceId);
        const token = localStorage.getItem('accessToken');
        try {
            if (!spaceId || spaceId === '-' || spaceId === 'undefined') {
                throw new Error('Invalid spaceId: ' + spaceId);
            }

            const response = await fetch(`http://localhost:8081/boardiox/spaces/${spaceId}/boards/${boardId}/delete`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete board: ${response.status} - ${errorText}`);
            }

            // Реактивное удаление из состояния
            setBoards(prev => prev.filter(board => board.boardId !== boardId));
        } catch (err) {
            console.error('Error deleting board:', err);
            throw err;
        }
    };

    return (
        <div className="space-page">
            <Header
                showLogo={true}
                showAvatars={true}
                showInvite={true}
                showNotifications={true}
                showProfile={true}
                usersInSpace={spaceData.usersInCurrentSpace}
                spaceOwner={spaceData.spaceCreator}
                currentUserId={spaceData.currentUser?.userId}
                currentUserAvatar={spaceData.currentUser?.avatar}
                currentUserName={spaceData.currentUser?.nickname}
                notificationCount={unreadCount}
                onInviteClick={handleInviteClick}
                userBoards={userBoards}
                allSpaceBoards={allSpaceBoards}
                spaceId={spaceId}
                spaceName={spaceData.spaceName}
                isSpaceCreator={spaceData.currentUser?.userId === spaceData.spaceCreator?.userId}

            />

            <div className="space-layout">
                <SpaceLeftSidebar
                    spaces={spaceData.spacesCurrentUserParticipate}
                    currentSpaceId={Number(spaceId)}
                    onSpaceSelect={handleSpaceSelect}
                    onCreateSpace={handleCreateSpace}
                    onEditSpace={handleEditSpace}
                    onDeleteSpace={handleDeleteSpace}
                    spaceOwnerId={spaceData.spaceCreator?.userId}
                    currentUserId={spaceData.currentUser?.userId}
                    spaceCreatedDate={spaceData.createdAt || ''}
                    spaceData={spaceData}
                    spacesOwnership={spacesOwnership}
                />

                <SpaceMainContent
                    spaceId={spaceId}
                    spaceName={spaceData.spaceName}
                    boards={boards}
                    usersInSpace={spaceData.usersInCurrentSpace || []}
                    currentUserId={spaceData.currentUser?.userId}
                    spaceCreatorId={spaceData.spaceCreator?.userId}
                    filter={filter}
                    sort={sort}
                    onFilterChange={setFilter}
                    onSortChange={setSort}
                    onCreateBoard={handleCreateBoard}
                    onEditBoard={handleEditBoard}
                    onDeleteBoard={handleDeleteBoard}
                />

                <CreateBoardPanel
                    isOpen={isCreateBoardPanelOpen}
                    onClose={() => setIsCreateBoardPanelOpen(false)}
                    onSubmit={handleCreateBoardSubmit}
                    usersInSpace={spaceData.usersInCurrentSpace || []}
                    currentUserId={spaceData.currentUser?.userId}
                    spaceCreatorId={spaceData.spaceCreator?.userId}
                />
            </div>
        </div>
    );
};

export default SpacePage;