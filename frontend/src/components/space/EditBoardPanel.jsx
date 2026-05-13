import React, { useState, useEffect, useRef } from 'react';

const EditBoardPanel = ({ isOpen, onClose, onSubmit, initialName }) => {
    const [boardName, setBoardName] = useState(initialName || '');
    const panelRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setBoardName(initialName || '');
        }
    }, [isOpen, initialName]);

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

    const handleSubmit = () => {
        if (boardName.trim()) {
            onSubmit(boardName.trim());
        }
    };

    if (!isOpen) return null;

    return (
        <div className="edit-board-overlay" onClick={onClose}>
            <div className="edit-board-panel" ref={panelRef}>
                <input
                    type="text"
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    placeholder="Название доски"
                    className="edit-board-input"
                    autoFocus
                />

                <div className="edit-board-buttons">
                    <button className="btn-cancel-edit" onClick={onClose}>
                        Отмена
                    </button>
                    <button
                        className="btn-confirm-edit"
                        onClick={handleSubmit}
                        disabled={!boardName.trim()}
                    >
                        Подтвердить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditBoardPanel;