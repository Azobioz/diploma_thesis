import React, { useState, useRef, useEffect } from 'react';
import CreateSpacePanel from "../left-panel/CreateSpacePanel";
import EditSpacePanel from "../left-panel/EditSpacePanel";
import DeleteConfirmPanel from "../left-panel/DeleteConfirmPanel";
import SpaceInfoPanel from "../left-panel/SpaceInfoPanel";

const SpaceLeftSidebar = ({
                              spaces = [],
                              currentSpaceId = null,
                              onSpaceSelect = () => {},
                              onCreateSpace = () => {},
                              onEditSpace = () => {},
                              onDeleteSpace = () => {},
                              spaceOwnerId = null,
                              currentUserId = null,
                              spaceCreatedDate = '',
                              spaceData = null,
                              spacesOwnership = {}
                          }) => {
    const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
    const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
    const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
    const [isDeletePanelOpen, setIsDeletePanelOpen] = useState(false);

    const [contextMenu, setContextMenu] = useState({
        isOpen: false,
        x: 0,
        y: 0,
        space: null
    });

    const [selectedSpaceData, setSelectedSpaceData] = useState({
        name: '',
        description: '',
        owner: '',
        createdDate: '',
        spaceId: null
    });

    const menuRef = useRef(null);

    const handleCreateSpaceSubmit = async (spaceData) => {
        await onCreateSpace(spaceData);
    };

    const handleContextMenu = (e, space) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            isOpen: true,
            x: e.pageX,
            y: e.pageY,
            space: space
        });
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setContextMenu(prev => ({ ...prev, isOpen: false }));
            }
        };
        if (contextMenu.isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [contextMenu.isOpen]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setContextMenu(prev => ({ ...prev, isOpen: false }));
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const isSpaceOwner = (space) => {
        if (space && space.spaceCreatedByUserId && currentUserId) {
            console.log(space.spaceCreatedByUserId === currentUserId)
            return space.spaceCreatedByUserId === currentUserId;
        }
        console.log(space.spaceCreatedByUserId)
        console.log(currentUserId)

        return false;
    };

    const handleSpaceInfo = () => {
        if (contextMenu.space) {
            // Находим владельца пространства из spaceData
            const ownerNickname = spaceData?.spaceCreator?.nickname || 'Неизвестно';
            const description = spaceData?.spaceDescription || 'Нет описания';
            setSelectedSpaceData({
                name: contextMenu.space.spaceName,
                description: description || 'Нет описания',
                owner: ownerNickname,
                createdDate: spaceCreatedDate || new Date().toLocaleDateString(),
                spaceId: contextMenu.space.spaceId
            });
            setIsInfoPanelOpen(true);
        }
        setContextMenu(prev => ({ ...prev, isOpen: false }));
    };

    const handleSpaceEdit = () => {
        if (contextMenu.space) {
            setSelectedSpaceData({
                name: contextMenu.space.spaceName,
                description: contextMenu.space.spaceDescription || '',
                spaceId: contextMenu.space.spaceId
            });
            setIsEditPanelOpen(true);
        }
        setContextMenu(prev => ({ ...prev, isOpen: false }));
    };

    const handleSpaceDelete = () => {
        if (contextMenu.space) {
            setSelectedSpaceData({
                name: contextMenu.space.spaceName,
                spaceId: contextMenu.space.spaceId
            });
            setIsDeletePanelOpen(true);
        }
        setContextMenu(prev => ({ ...prev, isOpen: false }));
    };

    const handleDeleteConfirm = async () => {
        await onDeleteSpace(selectedSpaceData.spaceId);
        setIsDeletePanelOpen(false);
    };

    const handleEditSubmit = async (spaceData) => {
        await onEditSpace(selectedSpaceData.spaceId, spaceData);
        setIsEditPanelOpen(false);
    };

    return (
        <>
            <aside className="space-left-side-bar">
                <button
                    className="add-space-button"
                    onClick={() => setIsCreatePanelOpen(true)}
                >
                    <span>Пространства</span>
                    <i className="bi bi-plus-square"></i>
                </button>
                <ul className="spaces-name-list">
                    {spaces.map(space => (
                        <div
                            key={space.spaceId}
                            className={`space-name ${space.spaceId === currentSpaceId ? 'active' : ''}`}
                            onClick={() => onSpaceSelect(space.spaceId)}
                            onContextMenu={(e) => handleContextMenu(e, space)}
                        >
                            {space.spaceName}
                        </div>
                    ))}
                </ul>
            </aside>

            {contextMenu.isOpen && (
                <div
                    className="space-context-menu"
                    ref={menuRef}
                    style={{
                        left: `${contextMenu.x}px`,
                        top: `${contextMenu.y}px`
                    }}
                >
                    <div className="context-menu-item" onClick={handleSpaceInfo}>
                        <i className="bi bi-info-circle"></i>
                        <span>Инфо</span>
                    </div>
                    {isSpaceOwner(contextMenu.space) && (
                        <>
                            <div className="context-menu-item" onClick={handleSpaceEdit}>
                                <i className="bi bi-pencil"></i>
                                <span>Изменить</span>
                            </div>
                            <div className="context-menu-item danger" onClick={handleSpaceDelete}>
                                <i className="bi bi-trash"></i>
                                <span>Удалить</span>
                            </div>
                        </>
                    )}
                </div>
            )}

            <SpaceInfoPanel
                isOpen={isInfoPanelOpen}
                onClose={() => setIsInfoPanelOpen(false)}
                spaceName={selectedSpaceData.name}
                spaceDescription={selectedSpaceData.description}
                ownerName={selectedSpaceData.owner}
                createdAt={selectedSpaceData.createdDate}
            />

            <EditSpacePanel
                isOpen={isEditPanelOpen}
                onClose={() => setIsEditPanelOpen(false)}
                onSubmit={handleEditSubmit}
                initialName={selectedSpaceData.name}
                initialDescription={selectedSpaceData.description}
            />

            <DeleteConfirmPanel
                isOpen={isDeletePanelOpen}
                onClose={() => setIsDeletePanelOpen(false)}
                onConfirm={handleDeleteConfirm}
                spaceName={selectedSpaceData.name}
            />

            <CreateSpacePanel
                isOpen={isCreatePanelOpen}
                onClose={() => setIsCreatePanelOpen(false)}
                onSubmit={handleCreateSpaceSubmit}
            />
        </>
    );
};

export default SpaceLeftSidebar;