import React, { useState, useRef, useEffect } from 'react';

const BoardContextMenu = ({
                              isOpen,
                              position,
                              onClose,
                              canEdit,
                              onInfo,
                              onRename,
                              onDelete,
                              onOpenInNewTab
                          }) => {
    const menuRef = useRef(null);

    // Закрытие меню при клике вне его
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
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

    if (!isOpen) return null;

    return (
        <div
            className="board-context-menu"
            ref={menuRef}
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: 1000
            }}
        >
            <button className="context-menu-item" onClick={onInfo}>
                Инфо
            </button>

            {canEdit && (
                <>
                    <button className="context-menu-item" onClick={onRename}>
                        Переименовать
                    </button>
                    <button className="context-menu-item danger" onClick={onDelete}>
                        Удалить
                    </button>
                </>
            )}

            <button className="context-menu-item" onClick={onOpenInNewTab}>
                Открыть в новой вкладке
            </button>
        </div>
    );
};

export default BoardContextMenu;