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

    const [selectedTask, setSelectedTask] = useState(null);
    const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

    const [listContextMenu, setListContextMenu] = useState({ isOpen: false, listId: null, x: 0, y: 0 });
    const listMenuRef = useRef(null);

    const [currentUserId, setCurrentUserId] = useState(null);
    const [isSpaceCreator, setIsSpaceCreator] = useState(false);

    // ← ДОБАВЛЕНО: Состояние для drag-and-drop
    const [draggedTask, setDraggedTask] = useState(null);
    const [dragOverListId, setDragOverListId] = useState(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowBoardDropdown(false);
            }
            if (listMenuRef.current && !listMenuRef.current.contains(event.target)) {
                setListContextMenu(prev => ({ ...prev, isOpen: false }));
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setListContextMenu(prev => ({ ...prev, isOpen: false }));
    }, [tasksData]);

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

                const response = await fetch(`http://localhost:8081/boardiox/spaces/${spaceId}/boards/${boardId}/tasks`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const data = await response.json();
                    setTasksData(data);

                    const spaceResponse = await fetch(`http://localhost:8081/boardiox/spaces/${spaceId}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });

                    let spaceCreatorId = null;
                    if (spaceResponse.ok) {
                        const spaceData = await spaceResponse.json();
                        spaceCreatorId = spaceData.spaceCreatedByUserId || spaceData.spaceCreator?.userId;
                    }

                    setIsSpaceCreator(Number(userId) === Number(spaceCreatorId));
                }

                const allBoardsResponse = await fetch(`http://localhost:8081/boardiox/spaces/${spaceId}/boards`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                });
                if (allBoardsResponse.ok) {
                    const data = await allBoardsResponse.json();
                    setAllSpaceBoards(data.boards || []);
                }

                if (userId) {
                    try {
                        const createdBoardsResponse = await fetch(`http://localhost:8081/boardiox/users/${userId}/created-boards`, {
                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        });
                        let boardsInCurrentSpace = [];
                        if (createdBoardsResponse.ok) {
                            const createdBoards = await createdBoardsResponse.json();
                            boardsInCurrentSpace = createdBoards.filter(board => board.spaceId === Number(spaceId));
                        }

                        const participantBoardsResponse = await fetch(`http://localhost:8081/boardiox/spaces/${spaceId}/boards/participant`, {
                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        });
                        if (participantBoardsResponse.ok) {
                            const participantBoards = await participantBoardsResponse.json();
                            const participantBoardsInSpace = participantBoards.filter(board => board.spaceId === Number(spaceId));
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
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (response.ok) {
                const fullTaskData = await response.json();
                setSelectedTask(fullTaskData);
            }
        } catch (err) {
            console.error("Error fetching task details:", err);
        }
    };

    const handleListMenuClick = (e, listId) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setListContextMenu({ isOpen: true, listId, x: rect.left, y: rect.bottom + 5 });
    };

    const handleDeleteList = async () => {
        if (!listContextMenu.listId) return;
        if (window.confirm('Вы уверены, что хотите удалить этот список?')) {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await fetch(`http://localhost:8081/boardiox/tasklists/${listContextMenu.listId}/delete`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    setTasksData(prev => ({
                        ...prev,
                        tasks: prev.tasks.filter(list => list.taskListId !== listContextMenu.listId)
                    }));
                    setListContextMenu(prev => ({ ...prev, isOpen: false }));
                } else {
                    alert('Ошибка при удалении списка');
                }
            } catch (err) {
                console.error('Error deleting list:', err);
                alert('Ошибка при удалении списка');
            }
        }
    };

    const handleRenameList = () => {
        if (!listContextMenu.listId) return;
        const list = tasksData?.tasks?.find(l => l.taskListId === listContextMenu.listId);
        if (!list) return;
        const newListName = prompt('Введите новое название списка:', list.taskListName);
        if (newListName && newListName.trim() && newListName.trim() !== list.taskListName) {
            handleRenameSubmit(listContextMenu.listId, newListName.trim());
        }
        setListContextMenu(prev => ({ ...prev, isOpen: false }));
    };

    const handleRenameSubmit = async (listId, newListName) => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`http://localhost:8081/boardiox/tasklists/${listId}/edit`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskListName: newListName }),
            });
            if (response.ok) {
                const updatedResponse = await fetch(`http://localhost:8081/boardiox/spaces/${spaceId}/boards/${boardId}/tasks`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                });
                if (updatedResponse.ok) {
                    const updatedData = await updatedResponse.json();
                    setTasksData(updatedData);
                }
            } else {
                alert('Ошибка при переименовании списка');
            }
        } catch (err) {
            console.error('Error renaming list:', err);
            alert('Ошибка при переименовании списка');
        }
    };

    const handleCreateTaskList = async ({ listName }) => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`http://localhost:8081/boardiox/${boardId}/tasklists/create`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskListName: listName, boardId: Number(boardId) }),
            });
            if (response.ok) {
                const newList = await response.json();
                setTasksData(prev => ({ ...prev, tasks: [...(prev.tasks || []), newList] }));
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
                files.forEach(file => formData.append('files', file));
            }

            const response = await fetch(`http://localhost:8081/boardiox/tasklists/${selectedListId}/tasks/create`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            if (response.ok) {
                const newTask = await response.json();
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

    // ← ДОБАВЛЕНО: Проверка прав на перемещение задачи
    const canMoveTask = (task, sourceListId, targetListId) => {
        if (!currentUserId) return false;

        const userId = Number(currentUserId);
        const taskCreatorId = task.createByUserAvatar?.userId;

        // 1. Создатель пространства - может всё
        if (isSpaceCreator) return true;

        // 2. Создатель доски - может перемещать задачи на своей доске
        if (currentBoard?.boardCreatedByUserId === userId) return true;

        // 3. Создатель задачи - может перемещать только свою задачу
        if (taskCreatorId === userId) return true;

        // 4. Создатель списка задач - может перемещать задачи из своего списка
        const sourceList = tasksData?.tasks?.find(l => l.taskListId === sourceListId);
        const targetList = tasksData?.tasks?.find(l => l.taskListId === targetListId);
        if (sourceList?.taskListCreatedByUserId === userId || targetList?.taskListCreatedByUserId === userId) return true;

        return false;
    };

    // ← ДОБАВЛЕНО: Обработчики drag-and-drop
    const handleDragStart = (e, task, sourceListId) => {
        setDraggedTask({ taskId: task.taskId, sourceListId, task });
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.taskId);
    };

    const handleDragEnd = () => {
        setDraggedTask(null);
        setDragOverListId(null);
    };

    const handleDragOver = (e, listId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverListId(listId);
    };

    const handleDragLeave = () => {
        setDragOverListId(null);
    };

    const handleDrop = async (e, targetListId) => {
        e.preventDefault();
        setDragOverListId(null);

        if (!draggedTask) return;
        if (draggedTask.sourceListId === targetListId) return; // Тот же список

        const task = draggedTask.task;

        // Проверка прав
        if (!canMoveTask(task, draggedTask.sourceListId, targetListId)) {
            alert('У вас нет прав для перемещения этой задачи');
            setDraggedTask(null);
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');

            // Вызов API для перемещения
            const response = await fetch(`http://localhost:8081/boardiox/tasks/${draggedTask.taskId}/move`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetTaskListId: targetListId }),
            });

            if (response.ok) {
                // Реактивное обновление UI
                setTasksData(prev => {
                    const newTasks = prev.tasks.map(list => {
                        if (list.taskListId === draggedTask.sourceListId) {
                            // Удаляем из исходного списка
                            return {
                                ...list,
                                tasks: list.tasks.filter(t => t.taskId !== draggedTask.taskId)
                            };
                        }
                        if (list.taskListId === targetListId) {
                            // Добавляем в целевой список
                            return {
                                ...list,
                                tasks: [...list.tasks, draggedTask.task]
                            };
                        }
                        return list;
                    });
                    return { ...prev, tasks: newTasks };
                });
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Ошибка при перемещении: ${errorData.message || 'Неизвестная ошибка'}`);
            }
        } catch (err) {
            console.error('Error moving task:', err);
            alert('Ошибка при перемещении задачи');
        }

        setDraggedTask(null);
    };

    if (loading) return <div className="tasks-loading">Загрузка...</div>;
    if (!tasksData) return <div className="tasks-error">Не удалось загрузить данные</div>;

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
                        <button className="board-dropdown-button" onClick={() => setShowBoardDropdown(!showBoardDropdown)}>
                            {currentBoard?.boardName || 'Выберите доску'}
                        </button>
                        {showBoardDropdown && (
                            <div className="board-dropdown-menu">
                                {availableBoards.map(board => (
                                    <div key={board.boardId} className={`board-dropdown-item ${board.boardId === Number(boardId) ? 'active' : ''}`} onClick={() => handleBoardSelect(board.boardId)}>
                                        {board.boardName}
                                    </div>
                                ))}
                                {availableBoards.length === 0 && <div className="board-dropdown-empty">Нет доступных досок</div>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="task-lists-container">
                    {tasksData.tasks.map(list => {
                        const isListCreator = list.taskListCreatedByUserId === Number(currentUserId);
                        const isBoardCreator = currentBoard?.boardCreatedByUserId === Number(currentUserId);
                        const showMenuButton = isSpaceCreator || isBoardCreator || isListCreator;

                        // ← ДОБАВЛЕНО: Подсветка списка при перетаскивании
                        const isDragOver = dragOverListId === list.taskListId;

                        return (
                            <div
                                key={list.taskListId}
                                className={`task-list ${isDragOver ? 'drag-over' : ''}`}
                                // ← ДОБАВЛЕНО: Drop zone для списка
                                onDragOver={(e) => handleDragOver(e, list.taskListId)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, list.taskListId)}
                            >
                                <div className="task-list-header">
                                    <h3 className="list-name">{list.taskListName}</h3>
                                    {showMenuButton && (
                                        <button className="list-menu-btn" onClick={(e) => handleListMenuClick(e, list.taskListId)}>
                                            <i className="bi bi-three-dots"></i>
                                        </button>
                                    )}
                                </div>

                                <div className="task-cards">
                                    {(list.tasks || []).map(task => {
                                        // Проверяем, может ли пользователь перетаскивать эту задачу
                                        const canDrag = canMoveTask(task, list.taskListId, list.taskListId);

                                        return (
                                            <div
                                                key={task.taskId}
                                                className={`task-card ${task.isTaskCompleted ? 'task-card-completed' : ''} ${canDrag ? 'draggable' : ''}`}
                                                onClick={() => handleTaskClick(task.taskId)}
                                                style={{ cursor: canDrag ? 'grab' : 'pointer' }}
                                                // ← ДОБАВЛЕНО: Drag handlers
                                                draggable={canDrag}
                                                onDragStart={(e) => handleDragStart(e, task, list.taskListId)}
                                                onDragEnd={handleDragEnd}
                                            >
                                                <p className="task-title">{task.taskName}</p>
                                                <div className="task-footer">
                                                    {task.deadline && (
                                                        <span className="task-deadline">
                                                            <i className="bi bi-clock"></i>
                                                            {new Date(task.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                                                        </span>
                                                    )}
                                                    {task.isTaskCompleted ? (
                                                        <div className="task-completed-icon"><i className="bi bi-check-circle-fill"></i></div>
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
                                        );
                                    })}
                                </div>

                                <button className="add-task-btn" onClick={() => handleAddTask(list.taskListId)}>
                                    <i className="bi bi-plus-square"></i> Добавить задачу
                                </button>
                            </div>
                        );
                    })}

                    <button className="create-list-btn" onClick={() => setIsCreateListPanelOpen(true)}>
                        <i className="bi bi-plus-lg"></i> Создать список
                    </button>
                </div>
            </div>

            {listContextMenu.isOpen && (
                <div className="task-list-context-menu" ref={listMenuRef} style={{ left: `${listContextMenu.x}px`, top: `${listContextMenu.y}px` }}>
                    <button className="context-menu-item danger" onClick={handleDeleteList}>
                        <i className="bi bi-trash"></i> Удалить
                    </button>
                    <button className="context-menu-item" onClick={handleRenameList}>
                        <i className="bi bi-pencil"></i> Изменить
                    </button>
                </div>
            )}

            <CreateTaskListPanel isOpen={isCreateListPanelOpen} onClose={() => setIsCreateListPanelOpen(false)} onSubmit={handleCreateTaskList} boardId={boardId} />
            <CreateTaskPanel isOpen={isCreateTaskPanelOpen} onClose={() => setIsCreateTaskPanelOpen(false)} onSubmit={handleCreateTaskSubmit} taskListId={selectedListId} />
            <TaskDetailPanel
                isOpen={isTaskDetailOpen}
                onClose={() => setIsTaskDetailOpen(false)}
                task={selectedTask}
                currentUserId={currentUserId}
                currentUserNickname={tasksData.currentUser?.nickname}
                currentUserAvatar={tasksData.currentUser?.avatar}
                spaceId={spaceId}
                boardId={boardId}
                spaceCreatorId={tasksData.spaceCreator?.userId}
                onTaskUpdated={(updatedTask) => {
                    setSelectedTask(updatedTask);
                    setTasksData(prev => ({
                        ...prev,
                        tasks: prev.tasks.map(list => ({
                            ...list,
                            tasks: list.tasks.map(t => t.taskId === updatedTask.taskId ? updatedTask : t)
                        }))
                    }));
                }}
            />
        </div>
    );
};

export default TasksPage;