import React, { useState, useRef, useEffect } from 'react';


const NotificationPanel = ({ count = 0 }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Закрытие панели при клике в любое место, кроме самой панели
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="notification-wrapper" ref={wrapperRef}>
            {/* Триггер (иконка колокольчика) */}
            <div className="notification-trigger" onClick={() => setIsOpen(!isOpen)}>
                <i className="bi bi-bell icon"></i>
                {<span className="notification-number">{count}</span>}
            </div>

            {/*Боковая панель*/}
            <div className={`notification-panel ${isOpen ? 'open' : ''}`}>
                <div className="notification-panel-header">
                    <div className="notification-text">Уведомления</div>
                    <i className="bi bi-box-arrow-up-right notification-panel-header-icon"></i>
                </div>

                <div className="panel-content">
                </div>
            </div>
        </div>
    );
};

export default NotificationPanel;