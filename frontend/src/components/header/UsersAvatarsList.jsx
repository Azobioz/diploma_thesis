import React, {useRef, useState} from 'react';

const UserAvatarsList = ({ users = [], maxDisplay = 3 }) => {
    const displayUsers = users.slice(0, maxDisplay);
    const remainingCount = Math.max(0, users.length - maxDisplay);

    return (
        <div className="user-avatars-list">
            {displayUsers.map((user, index) => (
                <div
                    key={user.userId}
                    className={`avatar-in-list`}
                    style={{
                        backgroundColor: user.avatar ? 'transparent' : '#FF6B6B',
                        position: 'relative',
                        overflow: 'hidden' // Чтобы картинка не вылезала за круг
                    }}
                >
                    {user.avatar ? (
                        // Если есть аватарка — показываем картинку
                        <img
                            src={`image/png;base64,${user.avatar}`}
                            alt={user.nickname}
                            className="avatar-img"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    ) : (
                        // Если нет аватарки — показываем первую букву
                        <span className="avatar-initials">
                            {getInitials(user.nickname)}
                        </span>
                    )}
                </div>
            ))}

            { remainingCount > 0 && (
                <div className="remaining-count">
                    +{remainingCount}
                </div>
            )}
        </div>
    );
};

// Вспомогательные функции
const getInitials = (nickname) => nickname ? nickname.charAt(0).toUpperCase() : '?';

export default UserAvatarsList;