import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../designs/spacepage/NotificationPanel.css';

const NOTIFICATION_ICONS = {
    USER_ADDED_TO_SPACE: 'bi bi-person-plus',
    TASK_ADDED_TO_BOARD: 'bi bi-clipboard-check',
    DEFAULT: 'bi bi-bell',
};

const NotificationPanel = ({ count = 0, spaceId = null }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifs, setLoadingNotifs] = useState(false);
    const wrapperRef = useRef(null);
    const navigate = useNavigate();

    // Закрытие панели при клике вне
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Загружаем уведомления при открытии панели
    useEffect(() => {
        if (!isOpen || !spaceId) return;

        const fetchNotifications = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) return;
            try {
                setLoadingNotifs(true);
                const res = await fetch(
                    `http://localhost:8081/boardiox/spaces/${spaceId}/notifications`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                if (res.ok) setNotifications(await res.json() || []);
            } catch (err) {
                console.error('Failed to load notifications:', err);
            } finally {
                setLoadingNotifs(false);
            }
        };

        fetchNotifications();
    }, [isOpen, spaceId]);

    const handleOpenFullPage = (e) => {
        e.stopPropagation();
        if (spaceId) navigate(`/boardiox/spaces/${spaceId}/notifications`);
    };

    return (
        <div className="notification-wrapper" ref={wrapperRef}>
            <div className="notification-trigger" onClick={() => setIsOpen(!isOpen)}>
                <i className="bi bi-bell icon"></i>
                <span className="notification-number">{count}</span>
            </div>

            <div className={`notification-panel ${isOpen ? 'open' : ''}`}>
                <div className="notification-panel-header">
                    <div className="notification-text">Уведомления</div>
                    <i
                        className="bi bi-box-arrow-up-right notification-panel-header-icon"
                        onClick={handleOpenFullPage}
                        title="Открыть страницу уведомлений"
                    />
                </div>

                <div className="panel-content">
                    {loadingNotifs ? (
                        <div className="panel-notifications-empty">Загрузка...</div>
                    ) : notifications.length === 0 ? (
                        <div className="panel-notifications-empty">Нет уведомлений</div>
                    ) : (
                        notifications.map(n => (
                            <div key={n.id} className="panel-notification-item">
                                <div className="panel-notification-icon">
                                    <i className={NOTIFICATION_ICONS[n.type] || NOTIFICATION_ICONS.DEFAULT} />
                                </div>
                                <span className="panel-notification-message">{n.message}</span>
                                <div className={`panel-notification-divider ${n.read ? 'panel-notification-divider--read' : 'panel-notification-divider--unread'}`} />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationPanel;
