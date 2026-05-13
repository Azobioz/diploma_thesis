import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfilePanel = ({
                          avatar = null,
                          nickname = '',
                          currentUserId = null
                      }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const initials = nickname ? nickname.charAt(0).toUpperCase() : '?';

    // Закрытие меню при клике вне его
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Функция выхода из системы
    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await fetch('http://localhost:8081/boardiox/auth/logout', {
                    method: 'POST',
                    headers: {
                        'X-Refresh-Token': refreshToken,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userId');
            navigate('/boardiox/auth');
        }
    };

    // ← ИСПРАВЛЕНО: надёжное получение userId
    const handleProfileClick = () => {
        const userId = currentUserId || localStorage.getItem('userId');
        if (userId) {
            navigate(`/boardiox/profile/${userId}`);
            setIsOpen(false);
        } else {
            console.error('User ID is not available');
        }
    };

    const handleSettingsClick = () => {
        const userId = currentUserId || localStorage.getItem('userId');
        if (userId) {
            navigate(`/boardiox/${userId}/settings`);
            setIsOpen(false);
        }
    };

    return (
        <div className="profile-menu-container" ref={dropdownRef}>
            <div
                className={`profile-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {avatar ? (
                    <img src={`data:image/png;base64,${avatar}`} alt="Profile" className="profile-avatar-img" />
                ) : (
                    <span className="profile-initials">{initials}</span>
                )}
            </div>
            {isOpen && (
                <div className="profile-dropdown-menu">
                    <div className="menu-item" onClick={handleProfileClick}>
                        Профиль
                    </div>
                    <div className="menu-item" onClick={handleSettingsClick}>
                        Настройки
                    </div>
                    <div className="menu-divider"></div>
                    <div className="menu-item logout-item" onClick={handleLogout}>
                        Выйти
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePanel;