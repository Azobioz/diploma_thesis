import React, { useState, useRef, useEffect } from 'react';
import UsersAvatarsList from "./UsersAvatarsList";

const UserListDropdown = ({
                              usersInSpaceDropdown, // Массив всех пользователей в пространстве
                              // Ожидает массив объектов пользователей с полями userId, nickname, avatar.
                              spaceOwnerDropdown,
                              onClose
                          }) => {

    const [isOpen, setIsOpen] = useState(false); //Управляет видимостью выпадающего списка
    const dropdownRef = useRef(null); //Нужна, чтобы отслеживать клики вне компонента

    const participants = usersInSpaceDropdown.filter(user =>
        user.userId !== spaceOwnerDropdown.userId
    );

    const toggleDropdown = () => setIsOpen(!isOpen);

    // Закрытие при клике вне компонента
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (
        <div className="user-list-dropdown-container" ref={dropdownRef}>
            <div onClick={toggleDropdown}>
                <UsersAvatarsList users={usersInSpaceDropdown} maxDisplay={3} />
            </div>

            {/* Выпадающее меню */}
            {isOpen && (
                <div className={`user-list-dropdown ${isOpen ? 'show' : ''}`}>
                    {/* Владелец пространства */}
                    <div className="dropdown-section">
                        <div className="owner-of-space-text">Владелец пространства</div>
                        {spaceOwnerDropdown && (
                            <div className="owner-data owner">
                                <div className="user-avatar-circle">
                                    {spaceOwnerDropdown.avatar ? (
                                        <img
                                            src={`data:image/png;base64,${spaceOwnerDropdown.avatar}`}
                                            alt={spaceOwnerDropdown.nickname}
                                        />
                                    ) : (
                                        <span>{spaceOwnerDropdown.nickname.charAt(0).toUpperCase() || '?'}</span>
                                    )}
                                </div>
                                <span className="user-name">{spaceOwnerDropdown.nickname}</span>
                            </div>
                        )}
                    </div>

                    {/* Участники */}
                    {participants.length > 0 && (
                        <div className="dropdown-section">
                            <div className="other-people-in-space-text">Участники</div>
                            {participants.map(user => (
                                <div key={user.userId} className="other-user-block">
                                    <div className="user-avatar-circle">
                                        {user.avatar ? (
                                            <img
                                                src={`data:image/png;base64,${user.avatar}`}
                                                alt={user.nickname}
                                            />
                                        ) : (
                                            <span>{user.nickname?.[0]?.toUpperCase() || '?'}</span>
                                        )}
                                    </div>
                                    <span className="user-name" > {user.nickname}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserListDropdown;