    import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/header/Header';
import CreateTaskListPanel from "../components/task/CreateTaskListPanel";
import CreateTaskPanel from "../components/task/CreateTaskPanel";
import TaskDetailPanel from "../components/task/TaskDetailPanel";

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

    // Состояния для задачи
    const [selectedTask, setSelectedTask] = useState(null);
    const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

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

                // 1. Загружаем данные страницы задач
                const response = await fetch(`http://localhost:8081/boardiox/spaces/${spaceId}/boards/${boardId}/tasks`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setTasksData(data);
                    // Проверка на создателя пространства
                    setIsSpaceCreator(data.currentUser?.userId === data.spaceCreator?.userId);
                }

                // 2. Загружаем все доски
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

                // 3. Загружаем доски пользователя
                // Получаем доски, где пользователь участвует (как создатель ИЛИ как участник)
                if (userId) {
                    try {
                        const token = localStorage.getItem('accessToken');

                        // 1. Загружаем доски, где пользователь создатель
                        const createdBoardsResponse = await fetch(`http://localhost:8081/boardiox/users/${userId}/created-boards`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        });

                        let boardsInCurrentSpace = [];

                        if (createdBoardsResponse.ok) {
                            const createdBoards = await createdBoardsResponse.json();
                            boardsInCurrentSpace = createdBoards.filter(board =>
                                board.spaceId === Number(spaceId)
                            );
                        }

                        // 2. Загружаем доски, где пользователь участник (не создатель)
                        const participantBoardsResponse = await fetch(`http://localhost:8081/boardiox/spaces/${spaceId}/boards/participant`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        });

                        if (participantBoardsResponse.ok) {
                            const participantBoards = await participantBoardsResponse.json();
                            // Фильтруем только доски из текущего пространства
                            const participantBoardsInSpace = participantBoards.filter(board =>
                                board.spaceId === Number(spaceId)
                            );

                            // Объединяем с досками-создателями (убираем дубликаты)
                            const existingBoardIds = new Set(boardsInCurrentSpace.map(b => b.boardId));
                            participantBoardsInSpace.forEach(board => {
                                if (!existingBoardIds.has(board.boardId)) {
                                    boardsInCurrentSpace.push(board);
                                }
                            });
                        }

                        setUserBoards(boardsInCurrentSpace);
                    } catch (err) {
                        console.error("Error fetching user boards:", err);
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

    const handleTaskClick = async (taskId) => {
        setIsTaskDetailOpen(true);
        setSelectedTask(null);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`http://localhost:8081/boardiox/spaces/${spaceId}/boards/${boardId}/tasks/${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                const fullTaskData = await response.json();
                setSelectedTask(fullTaskData);
            }
        } catch (err) {
            console.error("Error fetching task details:", err);
        }
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
                // Реактивно добавляем задачу с данными создателя
                const taskWithCreator = {
                    ...newTask,
                    createByUserAvatar: {
                        userId: Number(userId),
                        nickname: tasksData.currentUser?.nickname || 'User',
                        avatar: tasksData.currentUser?.avatar
                    }
                };

                setTasksData(prev => ({
                    ...prev,
                    tasks: (prev.tasks || []).map(list =>
                        list.taskListId === selectedListId
                            ? { ...list, tasks: [...(list.tasks || []), taskWithCreator] }
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

    return (
        <div className="tasks-page">
            <Header
                showLogo={true}
                showAvatars={false}
                showInvite={false}
                showNotifications={false}
                showProfile={true}
                currentUserId={currentUserId}
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
                                    <div
                                        key={task.taskId}
                                        className={`task-card ${task.isTaskCompleted ? 'task-card-completed' : ''}`}
                                        onClick={() => handleTaskClick(task.taskId)}
                                        style={{ cursor: 'pointer' }}
                                    >
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

                                            {/* Если задача выполнена, показываем галочку вместо аватарки создателя */}
                                            {task.isTaskCompleted ? (
                                                <div className="task-completed-icon">
                                                    <i className="bi bi-check-circle-fill"></i>
                                                </div>
                                            ) : (
                                                task.createByUserAvatar && (
                                                    <div className="task-creator-avatar-in-task-card">
                                                        {task.createByUserAvatar.avatar ? (
                                                            <img src={`data:image/png;base64,${task.createByUserAvatar.avatar}`} alt="Creator" />
                                                        ) : (
                                                            <span>{(task.createByUserAvatar.nickname || '?').charAt(0).toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                )
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

                    <button
                        className="create-list-btn"
                        onClick={() => setIsCreateListPanelOpen(true)}
                    >
                        <i className="bi bi-plus-lg"></i>
                        Создать список
                    </button>
                </div>
            </div>

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

            <TaskDetailPanel
                isOpen={isTaskDetailOpen}
                onClose={() => setIsTaskDetailOpen(false)}
                task={selectedTask}
                currentUserId={currentUserId}
                currentUserNickname={tasksData.currentUser?.nickname}
                currentUserAvatar={tasksData.currentUser?.avatar}
                spaceId={spaceId}
                boardId={boardId}
                spaceCreatorId={tasksData.spaceCreator?.userId} // ← ЭТО ОБЯЗАТЕЛЬНО!
                onTaskUpdated={(updatedTask) => {
                    setSelectedTask(updatedTask);
                    setTasksData(prev => ({
                        ...prev,
                        tasks: prev.tasks.map(list => ({
                            ...list,
                            tasks: list.tasks.map(t =>
                                t.taskId === updatedTask.taskId ? updatedTask : t
                            )
                        }))
                    }));
                }}
            />
        </div>
    );
};

export default TasksPage;