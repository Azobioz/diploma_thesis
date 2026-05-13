import React, { useState, useEffect, useRef } from 'react';

const CreateSpacePanel = ({ isOpen, onClose, onSubmit }) => {
    const [spaceName, setSpaceName] = useState('');
    const [spaceDescription, setSpaceDescription] = useState('');
    const [errors, setErrors] = useState({
        spaceName: '',
        spaceDescription: ''
    });
    const panelRef = useRef(null);

    const MAX_NAME_LENGTH = 30;
    const MAX_DESCRIPTION_LENGTH = 200; // Опционально для описания

    // Сброс формы при открытии
    useEffect(() => {
        if (isOpen) {
            setSpaceName('');
            setSpaceDescription('');
            setErrors({ spaceName: '', spaceDescription: '' });
        }
    }, [isOpen]);

    // Закрытие при клике вне панели
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
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

    // Валидация названия
    const validateSpaceName = (name) => {
        if (name.length > MAX_NAME_LENGTH) {
            return `Название не должно превышать ${MAX_NAME_LENGTH} символов`;
        }
        return '';
    };

    // Валидация описания
    const validateSpaceDescription = (description) => {
        if (description.length > MAX_DESCRIPTION_LENGTH) {
            return `Описание не должно превышать ${MAX_DESCRIPTION_LENGTH} символов`;
        }
        return '';
    };

    const handleNameChange = (e) => {
        const value = e.target.value;
        setSpaceName(value);
        const error = validateSpaceName(value);
        setErrors(prev => ({ ...prev, spaceName: error }));
    };

    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        setSpaceDescription(value);
        const error = validateSpaceDescription(value);
        setErrors(prev => ({ ...prev, spaceDescription: error }));
    };

    const handleClose = () => {
        setSpaceName('');
        setSpaceDescription('');
        setErrors({ spaceName: '', spaceDescription: '' });
        onClose();
    };

    const handleSubmit = () => {
        // Валидация перед отправкой
        const nameError = validateSpaceName(spaceName);
        const descriptionError = validateSpaceDescription(spaceDescription);

        setErrors({
            spaceName: nameError,
            spaceDescription: descriptionError
        });

        // Если есть ошибки - не отправляем
        if (nameError || descriptionError) {
            return;
        }

        onSubmit({
            spaceName: spaceName.trim(),
            spaceDescription: spaceDescription.trim()
        });

        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className="create-space-overlay">
            <div className="create-space-panel" ref={panelRef}>
                <div className="panel-input-group">
                    <input
                        type="text"
                        value={spaceName}
                        onChange={handleNameChange}
                        placeholder="Название пространства"
                        className={`panel-input ${errors.spaceName ? 'input-error' : ''}`}
                        autoFocus
                        maxLength={MAX_NAME_LENGTH + 1} // Небольшой буфер, валидация не пропустит
                    />
                    <div className="input-counter">
                        {spaceName.length} / {MAX_NAME_LENGTH}
                    </div>
                    {errors.spaceName && (
                        <div className="error-message">
                            {errors.spaceName}
                        </div>
                    )}
                </div>

                <div className="panel-input-group">
                    <input
                        type="text"
                        value={spaceDescription}
                        onChange={handleDescriptionChange}
                        placeholder="Описание пространства"
                        className={`panel-input ${errors.spaceDescription ? 'input-error' : ''}`}
                        maxLength={MAX_DESCRIPTION_LENGTH + 10}
                    />
                    {errors.spaceDescription && (
                        <div className="error-message">
                            {errors.spaceDescription}
                        </div>
                    )}
                </div>

                <div className="panel-buttons">
                    <button className="btn-cancel-create-space" onClick={handleClose}>
                        Отмена
                    </button>
                    <button
                        className={`btn-confirm-create-space ${errors.spaceName || errors.spaceDescription || !spaceName.trim() ? 'btn-disabled' : ''}`}
                        onClick={handleSubmit}
                        disabled={!!errors.spaceName || !!errors.spaceDescription || !spaceName.trim()}
                    >
                        Подтвердить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateSpacePanel;