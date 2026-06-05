import React, { useState, useEffect, useRef } from 'react';

const TaskDetailPanel = ({
                             isOpen,
                             onClose,
                             task,
                             currentUserId,
                             currentUserNickname,
                             currentUserAvatar,
                             spaceId,
                             boardId,
                             spaceCreatorId,
                             onTaskUpdated
                         }) => {
    const [commentText, setCommentText] = useState('');
    const [assignees, setAssignees] = useState(task?.assignees || []);
    const [isTaskCompleted, setIsTaskCompleted] = useState(task?.isTaskCompleted || false);
    const [comments, setComments] = useState(task?.comments || []);
    const panelRef = useRef(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    // Определяем, может ли пользователь отметить задачу как выполненную
    const canMarkAsCompleted = currentUserId && task && (
        Number(currentUserId) === Number(task?.createdByUserId) ||
        Number(currentUserId) === Number(spaceCreatorId)
    );

    // Синхронизируем локальное состояние с пропсом при изменении задачи
    useEffect(() => {
        if (task) {
            setAssignees(task.assignees || []);
            setIsTaskCompleted(task.isTaskCompleted || false);
            setComments(task.taskComments);
        } else {
            setAssignees([]);
            setIsTaskCompleted(false);
            setComments([]);
        }
    }, [task]);

    // Закрытие панели при клике вне её
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Сброс комментария при открытии
    useEffect(() => {
        if (isOpen) {
            setCommentText('');
        }
    }, [isOpen]);

    if (!isOpen || !task) return null;

    const handleFileDownload = (file) => {
        if (!file.fileData) return;
        try {
            const byteCharacters = atob(file.fileData);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: file.fileType || 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error downloading file:", err);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleTakeTask = async () => {
        if (isUpdating) return;

        const userIdNum = Number(currentUserId);
        const isAlreadyAssignee = assignees.some(u => u.userId === userIdNum);

        if (isAlreadyAssignee) {
            alert('Вы уже выполняете эту задачу');
            return;
        }

        setIsUpdating(true);

        try {
            const token = localStorage.getItem('accessToken');

            const response = await fetch(`http://localhost:8081/boardiox/tasks/${task.taskId}/take`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const updatedTaskResponse = await fetch(
                    `http://localhost:8081/boardiox/spaces/${spaceId}/boards/${boardId}/tasks/${task.taskId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (updatedTaskResponse.ok) {
                    const updatedTaskData = await updatedTaskResponse.json();
                    setAssignees(updatedTaskData.assignees || []);
                    if (onTaskUpdated) {
                        onTaskUpdated(updatedTaskData);
                    }
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Ошибка: ${errorData.message || 'Не удалось взять задачу'}`);
            }
        } catch (err) {
            console.error('Error taking task:', err);
            alert('Ошибка при взятии задачи');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleMarkAsCompleted = async () => {
        if (isUpdating) return;
        setIsUpdating(true);

        try {
            const token = localStorage.getItem('accessToken');

            const response = await fetch(`http://localhost:8081/boardiox/tasks/${task.taskId}/complete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const updatedTaskResponse = await fetch(
                    `http://localhost:8081/boardiox/spaces/${spaceId}/boards/${boardId}/tasks/${task.taskId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (updatedTaskResponse.ok) {
                    const updatedTaskData = await updatedTaskResponse.json();
                    setIsTaskCompleted(updatedTaskData.isTaskCompleted || false);
                    if (onTaskUpdated) {
                        onTaskUpdated(updatedTaskData);
                    }
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Ошибка: ${errorData.message || 'Не удалось отметить задачу'}`);
            }
        } catch (err) {
            console.error('Error completing task:', err);
            alert('Ошибка при отметке задачи');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCreateComment = async () => {
        if (!commentText.trim() || isSubmittingComment) return;

        setIsSubmittingComment(true);

        try {
            const token = localStorage.getItem('accessToken');

            const response = await fetch(`http://localhost:8081/boardiox/tasks/${task.taskId}/comments/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: commentText.trim()
                }),
            });

            if (response.ok) {
                // Получаем созданный комментарий с сервера
                const newComment = await response.json();
                console.log("newComment", newComment)
                // ← ВАЖНО: Проверяем структуру комментария
                // Если сервер вернул commentCreatedByUser, используем его
                // Иначе создаем author из текущих данных
                const commentWithAuthor =  newComment.commentCreatedByUser
                    ? newComment
                    : {
                        ...newComment,
                        author: {
                            userId: Number(currentUserId),
                            nickname: currentUserNickname,
                            avatar: currentUserAvatar
                        }
                    };

                // Реактивно добавляем комментарий в список
                const updatedComments = [...comments, commentWithAuthor];
                setComments(updatedComments);

                // Очищаем поле ввода
                setCommentText('');


            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Ошибка: ${errorData.message || 'Не удалось создать комментарий'}`);
            }
        } catch (err) {
            console.error('Error creating comment:', err);
            alert('Ошибка при создании комментария');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleCommentKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCreateComment();
        }
    };
    return (
        <div className="task-detail-overlay">
            <div className="task-detail-panel" ref={panelRef}>

                {/* Шапка */}
                <div className="task-detail-header-row">
                    <div className="task-title-row">
                        <i className="bi bi-clipboard-check"></i>
                        <h2 className="task-detail-title">{task.taskName}</h2>
                    </div>
                    <button className="btn-close-panel" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="task-detail-divider"></div>

                {/* Исполнители и Дедлайн */}
                <div className="task-detail-meta">
                    <div className="task-assignees">
                        <span className="meta-label">Задачу делают</span>
                        <div className="assignee-avatars">
                            {assignees.length > 0 ? (
                                assignees.map((user, index) => (
                                    <div key={user.userId || index} className="assignee-avatar-small">
                                        {user.avatar ? (
                                            <img src={`data:image/png;base64,${user.avatar}`} alt={user.nickname} />
                                        ) : (
                                            <span>{(user.nickname || '?').charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <span className="no-assignees-text">Никто</span>
                            )}
                        </div>
                    </div>

                    {task.deadline && (
                        <div className="task-deadline-info">
                            <span className="meta-label">Дедлайн</span>
                            <span className="deadline-value">{formatDate(task.deadline)}</span>
                        </div>
                    )}
                </div>

                {/* Описание */}
                {task.taskDescription && (
                    <div className="task-detail-section">
                        <div className="section-header">
                            <i className="bi bi-list-ul"></i>
                            <h3>Описание</h3>
                        </div>
                        <div className="section-content-gray">
                            <p className="task-description">{task.taskDescription}</p>
                        </div>
                    </div>
                )}

                {/* Прикрепленные файлы */}
                {task.attachedFiles && task.attachedFiles.length > 0 && (
                    <div className="task-detail-section">
                        <div className="section-header">
                            <i className="bi bi-paperclip"></i>
                            <h3>Прикрепленные файлы</h3>
                        </div>
                        <div className="files-grid">
                            {task.attachedFiles.map((file, index) => (
                                <button
                                    key={index}
                                    className="file-chip"
                                    onClick={() => handleFileDownload(file)}
                                >
                                    <i className="bi bi-file-earmark"></i>
                                    <span className="file-name">{file.fileName}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Комментарии */}
                <div className="task-detail-section">
                    <div className="section-header">
                        <i className="bi bi-chat-left-text"></i>
                        <h3>Комментарии</h3>
                    </div>
                    <div className="comments-wrapper">
                        <div className="comments-list">
                            {comments && comments.length > 0 ? (
                                comments.map((comment, index) => (
                                    <div key={index} className="comment-item">
                                        <div className="comment-avatar">
                                            {comment.author?.avatar || comment.commentCreatedByUser?.avatar ? (
                                                <img
                                                    src={`data:image/png;base64,${comment.author?.avatar || comment.commentCreatedByUser?.avatar}`}
                                                    alt={comment.author?.nickname || comment.commentCreatedByUser?.nickname}
                                                />
                                            ) : (
                                                <span>
                                                {(comment.author?.nickname || comment.commentCreatedByUser?.nickname || '?').charAt(0).toUpperCase()}
                                              </span>
                                            )}
                                        </div>
                                        <div className="comment-content">
                                            <div className="comment-header">
                                              <span className="comment-author">
                                                {comment.author?.nickname || comment.commentCreatedByUser?.nickname || 'User'}
                                              </span>
                                                <span className="comment-date">{formatDate(comment.createdAt)}</span>
                                            </div>
                                            <p className="comment-text">{comment.message}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-comments-placeholder">Пока нет комментариев</div>
                            )}
                        </div>

                        {/* Поле ввода комментария */}
                        <div className="comment-input-wrapper">
                            <div className="current-user-avatar">
                                {currentUserAvatar ? (
                                    <img src={`data:image/png;base64,${currentUserAvatar}`} alt="You" />
                                ) : (
                                    <span>{(currentUserNickname || 'A').charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <textarea
                                className="comment-input"
                                placeholder="Напишите комментарий..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={handleCommentKeyDown}
                                rows={2}
                                disabled={isSubmittingComment}
                            />
                            <button
                                className="comment-submit-btn"
                                onClick={handleCreateComment}
                                disabled={!commentText.trim() || isSubmittingComment}
                            >
                                {isSubmittingComment ? '⏳' : 'Отправить'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Кнопки действий */}
                <div className="task-detail-actions">
                    {isTaskCompleted ? (
                        <div className="task-completed-badge">
                            <i className="bi bi-check-circle-fill"></i>
                            Задача выполнена
                        </div>
                    ) : (
                        <div className="task-buttons-group">
                            <button
                                className={`btn-take-task ${isUpdating ? 'loading' : ''}`}
                                onClick={handleTakeTask}
                                disabled={isUpdating}
                            >
                                {isUpdating ? '⏳' : 'Взять задачу'}
                            </button>

                            {canMarkAsCompleted && (
                                <button
                                    className={`btn-complete-task ${isUpdating ? 'loading' : ''}`}
                                    onClick={handleMarkAsCompleted}
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? '⏳' : 'Отметить выполненной'}
                                </button>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default TaskDetailPanel;