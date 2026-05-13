import React from 'react';

const SpaceInfoPanel = ({
                            isOpen,
                            onClose,
                            spaceName = '',
                            spaceDescription = '',
                            ownerName = '',
                            createdAt = ''
                        }) => {
    if (!isOpen) return null;

    return (
        <div className="space-info-overlay" onClick={onClose}>
            <div className="space-info-panel" onClick={e => e.stopPropagation()}>
                <div className="info-section">
                    <label className="info-label">Название пространства</label>
                    <p className="info-value">{spaceName}</p>
                </div>
                <div className="info-section">
                    <label className="info-label">Описание</label>
                    <p className="info-value">{spaceDescription || 'Нет описания'}</p>
                </div>
                <div className="info-section">
                    <label className="info-label">Владелец:</label>
                    <span className="info-value-inline">{ownerName}</span>
                </div>
                <div className="info-section">
                    <label className="info-label">Пространство создано:</label>
                    <span className="info-value-inline">{createdAt}</span>
                </div>
            </div>
        </div>
    );
};

export default SpaceInfoPanel;