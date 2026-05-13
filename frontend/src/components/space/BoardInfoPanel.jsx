import React from 'react';

const BoardInfoPanel = ({ isOpen, onClose, boardData }) => {
    if (!isOpen || !boardData) return null;

    return (
        <div className="board-info-overlay" onClick={onClose}>
            <div className="board-info-panel" onClick={e => e.stopPropagation()}>
                <div className="info-section">
                    <label className="info-label">Название доски</label>
                    <p className="info-value">{boardData.boardName}</p>
                </div>

                <div className="info-section">
                    <label className="info-label">Владелец:</label>
                    <span className="info-value-inline">{boardData.ownerName}</span>
                </div>

                <div className="info-section">
                    <label className="info-label">Доска создана:</label>
                    <span className="info-value-inline">{boardData.createdAt}</span>
                </div>
            </div>
        </div>
    );
};

export default BoardInfoPanel;