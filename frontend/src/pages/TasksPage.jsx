import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/header/Header';
import CreateTaskListPanel from "../components/task/CreateTaskListPanel";
import CreateTaskPanel from "../components/task/CreateTaskPanel";

const TasksPage = () => {
    const { spaceId, boardId } = useParams();
    const navigate = useNavigate();
    const [tasksData, setTasksData] = useState(null);
    const [allSpaceBoards, setAllSpaceBoards] = useState([]);
    const [userBoards, setUserBoards] = useState([]);
    const [showBoardDropdown, setShowBoardDropdown] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isCreateListPanelOpen, setIsCreateListPanelOpen] = useState(false);
    const [isCreateTaskPanelOpen, setIsCreateTaskPanelOpen] = useState(false);
    const [selectedListId, setSelectedListId] = useState(null);
    const dropdownRef = useRef(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isSpaceCreator, setIsSpaceCreator] = useState(false);

    // Закрытие dropdown при клике вне
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowBoardDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchTasksData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const userId = localStorage.getItem('userId');
                setCurrentUserId(userId);

                if (!token) {
                    navigate('/boardiox/auth');
                    return;
                }

                // Получаем данные страницы задач
                const response = await fetch(`http://localhost:8081/boardiox/spaces/${spaceId}/boards/${boardId}/tasks`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();

                    data.tasks?.forEach(list => {
                        list.tasks?.forEach(task => {
                            console.log('Task creator:', task.createByUserAvatar);
                        });
                    });

                    setTasksData(data);
                    setIsSpaceCreator(data.currentUser?.userId === data.spaceCreator?.userId);

                }

                // Получаем ВСЕ доски пространства
                const allBoardsResponse = await fetch(`http://localhost:8081/boardiox/spaces/${spaceId}/boards`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (allBoardsResponse.ok) {
                    const data = await allBoardsResponse.json();
                    setAllSpaceBoards(data.boards || []);
                }

                // Получаем доски, где пользователь участвует
                if (userId) {
                    const userBoardsResponse = await fetch(`http://localhost:8081/boardiox/users/${userId}/created-boards`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    if (userBoardsResponse.ok) {
                        const data = await userBoardsResponse.json();
                        const boardsInCurrentSpace = data.filter(board =>
                            board.spaceId === Number(spaceId)
                        );
                        setUserBoards(boardsInCurrentSpace);
                    }
                }

            } catch (err) {
                console.error('Error fetching tasks data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTasksData();
    }, [spaceId, boardId, navigate]);

    const availableBoards = isSpaceCreator ? allSpaceBoards : userBoards;
    const currentBoard = availableBoards.find(b => b.boardId === Number(boardId));

    const handleBoardSelect = (selectedBoardId) => {
        navigate(`/boardiox/spaces/${spaceId}/boards/${selectedBoardId}/tasks`);
        setShowBoardDropdown(false);
    };

    const handleCreateTaskList = async ({ listName }) => {
        try {
            const token = localStorage.getItem('accessToken');

            const response = await fetch(`http://localhost:8081/boardiox/${boardId}/tasklists/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    taskListName: listName,
                    boardId: Number(boardId)
                }),
            });

            if (response.ok) {
                const newList = await response.json();

                // Реактивно добавляем новый список в состояние
                setTasksData(prev => ({
                    ...prev,
                    tasks: [...(prev.tasks || []), newList]
                }));

                setIsCreateListPanelOpen(false);
            } else {
                const errorData = await response.json();
                alert(`Ошибка при создании списка: ${errorData.message || 'Неизвестная ошибка'}`);
            }
        } catch (err) {
            console.error('Error creating task list:', err);
            alert('Ошибка при создании списка задач');
        }
    };

    const handleAddTask = async (listId) => {
        setSelectedListId(listId);
        setIsCreateTaskPanelOpen(true);
    };

    const handleCreateTaskSubmit = async ({ taskName, taskDescription, deadline, files }) => {
        try {
            const token = localStorage.getItem('accessToken');
            const userId = localStorage.getItem('userId');

            const formData = new FormData();
            formData.append('taskName', taskName);
            formData.append('taskDescription', taskDescription || '');
            formData.append('deadline', deadline || '');
            formData.append('userId', userId);

            if (files && files.length > 0) {
                files.forEach(file => {
                    formData.append('files', file);
                });
            }

            const response = await fetch(`http://localhost:8081/boardiox/tasklists/${selectedListId}/tasks/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                const newTask = await response.json();

                // Реактивно добавляем задачу
                setTasksData(prev => ({
                    ...prev,
                    tasks: (prev.tasks || []).map(list =>
                        list.taskListId === selectedListId
                            ? { ...list, tasks: [...(list.tasks || []), newTask] }
                            : list
                    )
                }));

                setIsCreateTaskPanelOpen(false);
            } else {
                const errorData = await response.json();
                alert(`Ошибка при создании задачи: ${errorData.message || 'Неизвестная ошибка'}`);
            }
        } catch (err) {
            console.error('Error creating task:', err);
            alert('Ошибка при создании задачи');
        }
    };

    if (loading) {
        return <div className="tasks-loading">Загрузка...</div>;
    }

    if (!tasksData) {
        return <div className="tasks-error">Не удалось загрузить данные</div>;
    }

    const updateTaskAvatars = (tasksData) => {
        if (!tasksData || !tasksData.tasks) return tasksData;

        // Получаем всех уникальных пользователей из задач
        const userIds = new Set();
        tasksData.tasks.forEach(list => {
            list.tasks?.forEach(task => {
                if (task.createByUserAvatar?.userId) {
                    userIds.add(task.createByUserAvatar.userId);
                }
            });
        });

        // Если есть пользователи, обновляем их данные
        if (userIds.size === 0) return tasksData;

        return tasksData;
    };

    return (
        <div className="tasks-page">
            <Header
                showLogo={true}
                showAvatars={false}
                showInvite={false}
                showNotifications={false}
                showProfile={true}
                currentUserId={tasksData.currentUser?.userId}
                currentUserAvatar={tasksData.currentUser?.avatar}
                currentUserName={tasksData.currentUser?.nickname}
                notificationCount={0}
                onLogoClick={() => navigate(`/boardiox/spaces/${spaceId}`)}
            />

            <div className="tasks-content">
                <h1 className="space-name-in-tasks">{tasksData.spaceName}</h1>

                <div className="tasks-board-title">
                    <span>Задачи </span>

                    <div className="board-dropdown-wrapper" ref={dropdownRef}>
                        <button
                            className="board-dropdown-button"
                            onClick={() => setShowBoardDropdown(!showBoardDropdown)}
                        >
                            {currentBoard?.boardName || 'Выберите доску'}
                        </button>

                        {showBoardDropdown && (
                            <div className="board-dropdown-menu">
                                {availableBoards.map(board => (
                                    <div
                                        key={board.boardId}
                                        className={`board-dropdown-item ${board.boardId === Number(boardId) ? 'active' : ''}`}
                                        onClick={() => handleBoardSelect(board.boardId)}
                                    >
                                        {board.boardName}
                                    </div>
                                ))}
                                {availableBoards.length === 0 && (
                                    <div className="board-dropdown-empty">
                                        Нет доступных досок
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="task-lists-container">
                    {/* Списки задач */}
                    {tasksData.tasks.map(list => (
                        <div key={list.taskListId} className="task-list">
                            <div className="task-list-header">
                                <h3 className="list-name">{list.taskListName}</h3>
                                <button className="list-menu-btn">
                                    <i className="bi bi-three-dots"></i>
                                </button>
                            </div>

                            <div className="task-cards">
                                {(list.tasks || []).map(task => (
                                    <div key={task.taskId} className="task-card">
                                        <p className="task-title">{task.taskName}</p>
                                        <div className="task-footer">
                                            {task.deadline && (
                                                <span className="task-deadline">
                                                    <i className="bi bi-clock"></i>
                                                    {new Date(task.deadline).toLocaleDateString('ru-RU', {
                                                        day: 'numeric',
                                                        month: 'long'
                                                    })}
                                                </span>
                                            )}
                                            {task.createByUserAvatar && (
                                                <div className="task-creator-avatar-in-task-card">
                                                    {task.createByUserAvatar.avatar ? (
                                                        <img
                                                            src={`data:image/png;base64,${task.createByUserAvatar.avatar}`}
                                                            alt={task.createByUserAvatar.nickname || 'Creator'}
                                                        />
                                                    ) : (
                                                        <span className="avatar-initials">
                                                            {(task.createByUserAvatar.nickname || task.createByUserAvatar.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                className="add-task-btn"
                                onClick={() => handleAddTask(list.taskListId)}
                            >
                                <i className="bi bi-plus-square"></i>
                                Добавить задачу
                            </button>
                        </div>
                    ))}

                    {/* ← КНОПКА СОЗДАНИЯ СПИСКА - всегда видна */}
                    <button
                        className="create-list-btn"
                        onClick={() => setIsCreateListPanelOpen(true)}
                    >
                        <i className="bi bi-plus-lg"></i>
                        Создать список
                    </button>
                </div>
            </div>

            {/* ← ПАНЕЛЬ СОЗДАНИЯ СПИСКА */}
            <CreateTaskListPanel
                isOpen={isCreateListPanelOpen}
                onClose={() => setIsCreateListPanelOpen(false)}
                onSubmit={handleCreateTaskList}
                boardId={boardId}
            />

            <CreateTaskPanel
                isOpen={isCreateTaskPanelOpen}
                onClose={() => setIsCreateTaskPanelOpen(false)}
                onSubmit={handleCreateTaskSubmit}
                taskListId={selectedListId}
            />
        </div>
    );
};

export default TasksPage;