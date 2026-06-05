import React, { useState, useEffect, useRef } from 'react';
import '../../designs/taskpage/CreateTaskPanel.css';

const CreateTaskPanel = ({ isOpen, onClose, onSubmit, taskListId }) => {
    const [taskName, setTaskName] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [files, setFiles] = useState([]);
    const [error, setError] = useState('');
    const panelRef = useRef(null);
    const fileInputRef = useRef(null);
    const nameInputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                handleClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            setTimeout(() => nameInputRef.current?.focus(), 100);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setTaskName('');
            setTaskDescription('');
            setDeadline('');
            setFiles([]);
            setError('');
        }
    }, [isOpen]);

    const handleClose = () => {
        setTaskName('');
        setTaskDescription('');
        setDeadline('');
        setFiles([]);
        setError('');
        onClose();
    };

    const handleFileSelect = (e) => {
        const newFiles = Array.from(e.target.files);
        setFiles(prev => [...prev, ...newFiles]);
        e.target.value = '';
    };

    const handleRemoveFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!taskName.trim()) {
            setError('Введите название задачи');
            return;
        }
        onSubmit({
            taskName: taskName.trim(),
            taskDescription: taskDescription.trim(),
            deadline: deadline ? `${deadline}:00` : null,
            files
        });
        handleClose();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            handleClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="create-task-overlay">
            <div className="create-task-panel" ref={panelRef} onKeyDown={handleKeyDown}>

                {/* Поля ввода */}
                <div className="create-task-body">
                    <input
                        ref={nameInputRef}
                        type="text"
                        className="task-input-field"
                        value={taskName}
                        onChange={(e) => { setTaskName(e.target.value); if (error) setError(''); }}
                        placeholder="Название задачи"
                        maxLength={100}
                    />
                    <textarea
                        className="task-input-field task-textarea"
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        placeholder="Описание"
                        rows={2}
                        maxLength={500}
                    />
                    <input
                        type="datetime-local"
                        className="task-input-field task-deadline-field"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        placeholder="Дедлайн"
                    />
                </div>

                {/* Прикреплённые файлы */}
                {files.length > 0 && (
                    <div className="task-files-list">
                        {files.map((file, index) => (
                            <div key={index} className="task-file-item">
                                <div className="task-file-info">
                                    <i className="bi bi-file-earmark"></i>
                                    <span className="task-file-name">{file.name}</span>
                                </div>
                                <button className="task-file-remove" onClick={() => handleRemoveFile(index)}>
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Кнопка прикрепления */}
                <div className="task-file-upload">
                    <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
                    <button className="task-file-btn" onClick={() => fileInputRef.current?.click()}>
                        <i className="bi bi-download"></i>
                        Прикрепить файл...
                    </button>
                </div>

                {error && <div className="task-error-message">{error}</div>}

                {/* Кнопки */}
                <div className="create-task-buttons">
                    <button className="task-btn-cancel" onClick={handleClose}>Отмена</button>
                    <button className="task-btn-confirm" onClick={handleSubmit}>Подтвердить</button>
                </div>
            </div>
        </div>
    );
};

export default CreateTaskPanel;
