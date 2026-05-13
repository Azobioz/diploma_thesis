import React from 'react';

const DeleteConfirmPanel = ({
                                isOpen,
                                onClose,
                                onConfirm,
                                spaceName = ''
                            }) => {
    if (!isOpen) return null;

    return (
        <div className="delete-confirm-overlay" onClick={onClose}>
            <div className="delete-confirm-panel" onClick={e => e.stopPropagation()}>
                <p className="delete-confirm-text">Вы уверены, что хотите удалить пространство "{spaceName}"?</p>
                <div className="delete-confirm-buttons">
                    <button className="btn-confirm-delete" onClick={onConfirm}>
                        Да
                    </button>
                    <button className="btn-cancel-delete" onClick={onClose}>
                        Нет
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmPanel;