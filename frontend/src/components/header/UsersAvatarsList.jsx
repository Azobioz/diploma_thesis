import React, {useRef, useState} from 'react';

const UserAvatarsList = ({ users = [], maxDisplay = 3 }) => {
    const displayUsers = users.slice(0, maxDisplay);
    const remainingCount = Math.max(0, users.length - maxDisplay);

    // Функция для получения инициалов
    const getInitials = (nickname) => nickname ? nickname.charAt(0).toUpperCase() : '?';

    const hasValidAvatar = (avatar) => {
        if (!avatar) return false;
        if (typeof avatar !== 'string') return false;
        if (avatar.trim() === '') return false;
        if (avatar === 'null' || avatar === 'undefined') return false;
        return true;
    };


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
                    {/* Используем строгую проверку */}
                    {hasValidAvatar(user.avatar) ? (
                        <img
                            src={`data:image/png;base64,${user.avatar}`}
                            alt={user.nickname}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                            // На случай, если base64 битый, скрываем картинку и показываем инициалы (через CSS класс родителя, если нужно, но здесь просто скроем)
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    ) : (
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