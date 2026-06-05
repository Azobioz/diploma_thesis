import React, { useState } from 'react';
import Logo from './Logo';
import UserListDropdown from "./UserListDropdown";
import NotificationPanel from "./NotificationPanel";
import ProfilePanel from "./ProfilePanel";
import InvitePanel from "./InvitePanel";

const Header = ({
                    showLogo = true,
                    showAvatars = true,
                    showInvite = true,
                    showNotifications = true,
                    showProfile = true,
                    // Данные
                    usersInSpace = [],
                    spaceOwner = null,
                    currentUserId = null,
                    currentUserAvatar = null,
                    currentUserName = null,
                    notificationCount = 0,
                    spaceId = null,
                    spaceName = "",
                    userBoards = [],
                    allSpaceBoards = [],
                    // Обработчики событий
                    onInviteClick = () => {},
                    onNotificationClick = () => {},
                    onProfileClick = () => {},
                    onLogoClick = () => {}
                }) => {
    // Состояние для открытия/закрытия панели приглашения
    const [isInvitePanelOpen, setIsInvitePanelOpen] = useState(false);

    // Проверяем, является ли текущий пользователь создателем пространства ИЛИ имеет доски
    const canInvite = currentUserId && spaceOwner && (
        currentUserId === spaceOwner.userId ||
        (userBoards && userBoards.length > 0)
    );

    const handleOpenInvite = () => {
        if (canInvite) {
            setIsInvitePanelOpen(true);
        } else {
            console.warn("Only space creator or board creators can invite users.");
        }
    };

    return (
        <>
            <header className="space-header">
                {/* Левая часть - Логотип */}
                <div className="boardiox-text-in-header">
                    {showLogo && <Logo onClick={onLogoClick}/>}
                </div>

                {/* Центральная часть */}
                <div className="header-center">
                    {showAvatars && (
                        <UserListDropdown
                            usersInSpaceDropdown={usersInSpace}
                            spaceOwnerDropdown={spaceOwner}
                        />
                    )}

                    {/* Кнопка приглашения */}
                    {showInvite && canInvite && (
                        <button className="invite-button" onClick={handleOpenInvite}>
                            <span className="plus-icon-invite-button">+</span>
                            Пригласить участника
                        </button>
                    )}
                </div>

                {/* Правая часть */}
                <div className="header-right">
                    {showNotifications && (
                        <NotificationPanel
                            count={notificationCount}
                            spaceId={spaceId}
                            onClick={onNotificationClick}
                        />
                    )}

                    {showProfile && (
                        <ProfilePanel
                            avatar={currentUserAvatar}
                            nickname={currentUserName}
                            currentUserId={currentUserId}
                            onClick={onProfileClick}
                        />
                    )}
                </div>
            </header>

            {/* Панель приглашения */}
            <InvitePanel
                isOpen={isInvitePanelOpen}
                onClose={() => setIsInvitePanelOpen(false)}
                spaceId={spaceId}
                spaceName={spaceName}
                userBoards={userBoards}
                allSpaceBoards={allSpaceBoards}
                currentUserId={currentUserId}
                isSpaceCreator={currentUserId === spaceOwner?.userId}
            />
        </>
    );
};

export default Header;