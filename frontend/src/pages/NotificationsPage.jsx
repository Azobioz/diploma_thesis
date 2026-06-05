import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../designs/spacepage/NotificationsPage.css';

const NOTIFICATION_ICONS = {
    USER_ADDED_TO_SPACE: 'bi bi-person-plus',
    TASK_ADDED_TO_BOARD: 'bi bi-clipboard-check',
    DEFAULT: 'bi bi-bell',
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year}\n${hours}:${minutes}`;
};

const NotificationsPage = () => {
    const { spaceId } = useParams();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [spaces, setSpaces] = useState([]);
    const [currentSpaceName, setCurrentSpaceName] = useState('');
    const [loading, setLoading] = useState(true);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // При уходе со страницы — помечаем все уведомления как прочитанные
    useEffect(() => {
        return () => {
            const token = localStorage.getItem('accessToken');
            if (token && spaceId) {
                fetch(`http://localhost:8081/boardiox/spaces/${spaceId}/notifications/mark-read`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => {});
            }
        };
    }, [spaceId]);

    // Загрузка данных пространства и уведомлений
    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) { navigate('/boardiox/auth'); return; }

            try {
                setLoading(true);

                const spaceResponse = await fetch(
                    `http://localhost:8081/boardiox/spaces/${spaceId}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                if (!spaceResponse.ok) {
                    if (spaceResponse.status === 401 || spaceResponse.status === 403) navigate('/boardiox/auth');
                    return;
                }
                const spaceData = await spaceResponse.json();
                setSpaces(spaceData.spacesCurrentUserParticipate || []);
                setCurrentSpaceName(spaceData.spaceName || '');

                const notifResponse = await fetch(
                    `http://localhost:8081/boardiox/spaces/${spaceId}/notifications`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                if (notifResponse.ok) {
                    setNotifications(await notifResponse.json() || []);
                }
            } catch (err) {
                console.error('Error fetching notifications:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [spaceId, navigate]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSpaceSelect = (selectedSpaceId) => {
        setDropdownOpen(false);
        navigate(`/boardiox/spaces/${selectedSpaceId}/notifications`);
    };

    if (loading) return <div className="notifications-loading">Загрузка...</div>;

    return (
        <div className="notifications-page">
            <header className="notifications-header">
                <div className="notifications-header-logo" onClick={() => navigate(`/boardiox/spaces/${spaceId}`)}>
                    Boardiox
                </div>
            </header>

            <div className="notifications-content">
                <div className="notifications-filter-bar">
                    <span className="notifications-title">Все уведомления</span>

                    <div className="notifications-space-selector" ref={dropdownRef}>
                        <span className="notifications-from-label">Из</span>
                        <div
                            className="notifications-space-dropdown-trigger"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                        >
                            {currentSpaceName || 'Пространство'}
                        </div>

                        {dropdownOpen && (
                            <div className="notifications-space-dropdown">
                                {spaces.map(space => (
                                    <div
                                        key={space.spaceId}
                                        className={`notifications-space-option ${space.spaceId === Number(spaceId) ? 'active' : ''}`}
                                        onClick={() => handleSpaceSelect(space.spaceId)}
                                    >
                                        {space.spaceId === Number(spaceId) && (
                                            <span className="notifications-check">✓</span>
                                        )}
                                        {space.spaceName}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="notifications-divider" />

                {notifications.length === 0 ? (
                    <div className="notifications-empty">Нет уведомлений</div>
                ) : (
                    <div className="notifications-list">
                        {notifications.map(notification => (
                            <div key={notification.id} className="notification-item">
                                <div className="notification-icon">
                                    <i className={NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.DEFAULT} />
                                </div>
                                <div className="notification-body">
                                    <span className="notification-message">{notification.message}</span>
                                </div>
                                <div className="notification-date">
                                    {formatDate(notification.createdAt)}
                                </div>
                                {/* Красная линия = непрочитано, #64A1BA = прочитано */}
                                <div className={`notification-item-divider ${notification.read ? 'notification-item-divider--read' : 'notification-item-divider--unread'}`} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
