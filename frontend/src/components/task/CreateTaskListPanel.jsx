import React, { useState, useEffect, useRef } from 'react';

const CreateTaskListPanel = ({ isOpen, onClose, onSubmit, boardId, initialName = '' }) => {
    const [listName, setListName] = useState('');
    const [error, setError] = useState('');
    const panelRef = useRef(null);
    const inputRef = useRef(null);
    const MAX_LIST_NAME_LENGTH = 50;

    // Закрытие панели при клике вне её
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Фокус на поле ввода при открытии
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 100);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Заполняем поле при открытии (новое или rename)
    useEffect(() => {
        if (isOpen) {
            setListName(initialName || '');
            setError('');
            // Выделяем весь текст для удобного редактирования
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.select();
                }
            }, 150);
        }
    }, [isOpen, initialName]);

    // Валидация названия списка
    const validateListName = (name) => {
        if (name.length > MAX_LIST_NAME_LENGTH) {
            return `Название не должно превышать ${MAX_LIST_NAME_LENGTH} символов`;
        }
        return '';
    };

    const handleListNameChange = (e) => {
        const value = e.target.value;
        setListName(value);
        const error = validateListName(value);
        setError(error);
    };

    const handleClose = () => {
        setListName('');
        setError('');
        onClose();
    };

    const handleSubmit = () => {
        // Валидация перед отправкой
        const validationError = validateListName(listName);
        if (validationError) {
            setError(validationError);
            return;
        }

        onSubmit({
            listName: listName.trim(),
            boardId: boardId
        });

        handleClose();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            handleClose();
        }
    };

    // Проверка: можно ли подтвердить (нет ошибок + название не пустое + не больше 30 символов)
    const isConfirmDisabled = !listName.trim() ||
        listName.length > MAX_LIST_NAME_LENGTH ||
        !!error;

    if (!isOpen) return null;

    return (
        <div className="create-task-list-overlay">
            <div className="create-task-list-panel" ref={panelRef}>
                <div className="create-task-list-panel-content">
                    <div className="create-task-list-input-group">
                        <input
                            ref={inputRef}
                            type="text"
                            id="listName"
                            className={`create-task-list-input-field ${error ? 'create-task-list-input-field.input-error' : ''}`}
                            value={listName}
                            onChange={handleListNameChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Название списка"
                            maxLength={MAX_LIST_NAME_LENGTH + 1}
                        />
                        {error && (
                            <div className="create-task-list-error-message">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                <div className="panel-buttons">
                    <button className="create-task-list-btn-cancel" onClick={handleClose}>
                        Отмена
                    </button>
                    <button
                        className={`create-task-list-btn-confirm ${isConfirmDisabled ? 'create-task-list-btn-confirm.btn-disabled' : ''}`}
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

export default CreateTaskListPanel;